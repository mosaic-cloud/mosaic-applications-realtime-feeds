/*
 * #%L
 * mosaic-applications-realtime-feeds-indexer
 * %%
 * Copyright (C) 2010 - 2013 Institute e-Austria Timisoara (Romania)
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

package eu.mosaic_cloud.applications.realtime_feeds.indexer;


import java.util.UUID;

import eu.mosaic_cloud.cloudlets.connectors.kvstore.IKvStoreConnector;
import eu.mosaic_cloud.cloudlets.connectors.kvstore.IKvStoreConnectorCallback;
import eu.mosaic_cloud.cloudlets.connectors.kvstore.IKvStoreConnectorFactory;
import eu.mosaic_cloud.cloudlets.connectors.queue.amqp.IAmqpQueueConsumerConnector;
import eu.mosaic_cloud.cloudlets.connectors.queue.amqp.IAmqpQueueConsumerConnectorCallback;
import eu.mosaic_cloud.cloudlets.connectors.queue.amqp.IAmqpQueueConsumerConnectorFactory;
import eu.mosaic_cloud.cloudlets.core.CloudletCallbackArguments;
import eu.mosaic_cloud.cloudlets.core.CloudletCallbackCompletionArguments;
import eu.mosaic_cloud.cloudlets.core.ICallback;
import eu.mosaic_cloud.cloudlets.core.ICloudletController;
import eu.mosaic_cloud.cloudlets.tools.DefaultCloudletCallback;
import eu.mosaic_cloud.platform.core.configuration.ConfigurationIdentifier;
import eu.mosaic_cloud.platform.core.configuration.IConfiguration;
import eu.mosaic_cloud.platform.core.utils.DataEncoder;
import eu.mosaic_cloud.platform.core.utils.JsonDataEncoder;
import eu.mosaic_cloud.platform.core.utils.NullDataEncoder;
import eu.mosaic_cloud.tools.callbacks.core.CallbackCompletion;

import org.json.JSONObject;


public class IndexerCloudlet
{
	public static final class IndexerCloudletContext
	{
		IAmqpQueueConsumerConnector<JSONObject, Void> batchConsumer;
		IAmqpQueueConsumerConnectorCallback<IndexerCloudletContext, JSONObject, Void> batchConsumerCallback;
		ICloudletController<IndexerCloudletContext> cloudlet;
		IKvStoreConnector<byte[], UUID> dataStore;
		IKvStoreConnectorCallback<IndexerCloudletContext, byte[], UUID> dataStoreCallback;
		IKvStoreConnector<JSONObject, Void> itemsStore;
		IKvStoreConnectorCallback<IndexerCloudletContext, JSONObject, Void> itemsStoreCallback;
		IKvStoreConnector<JSONObject, UUID> metadataStore;
		IKvStoreConnectorCallback<IndexerCloudletContext, JSONObject, UUID> metadataStoreCallback;
		IKvStoreConnector<JSONObject, Void> tasksStore;
		IKvStoreConnectorCallback<IndexerCloudletContext, JSONObject, Void> tasksStoreCallback;
		IKvStoreConnector<JSONObject, UUID> timelinesStore;
		IKvStoreConnectorCallback<IndexerCloudletContext, JSONObject, UUID> timelinesStoreCallback;
		IAmqpQueueConsumerConnector<JSONObject, Void> urgentConsumer;
		IAmqpQueueConsumerConnectorCallback<IndexerCloudletContext, JSONObject, Void> urgentConsumerCallback;
	}
	
	public static final class LifeCycleHandler
			extends DefaultCloudletCallback<IndexerCloudletContext>
	{
		@Override
		public CallbackCompletion<Void> destroy (final IndexerCloudletContext context, final CloudletCallbackArguments<IndexerCloudletContext> arguments)
		{
			this.logger.info ("Feeds IndexerCloudlet is being destroyed.");
			return CallbackCompletion.createAndChained (context.metadataStore.destroy (), context.dataStore.destroy (), context.timelinesStore.destroy (), context.itemsStore.destroy (), context.tasksStore.destroy (), context.urgentConsumer.destroy (), context.batchConsumer.destroy ());
		}
		
		@Override
		public CallbackCompletion<Void> initialize (final IndexerCloudletContext context, final CloudletCallbackArguments<IndexerCloudletContext> arguments)
		{
			this.logger.info ("FeedIndexerCloudlet is being initialized.");
			context.cloudlet = arguments.getCloudlet ();
			final IConfiguration configuration = context.cloudlet.getConfiguration ();
			final IConfiguration metadataConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("metadata"));
			final DataEncoder<byte[]> nullEncoder = NullDataEncoder.DEFAULT_INSTANCE;
			final DataEncoder<JSONObject> jsonEncoder = JsonDataEncoder.DEFAULT_INSTANCE;
			context.metadataStoreCallback = new MetadataKVCallback ();
			context.metadataStore = context.cloudlet.getConnectorFactory (IKvStoreConnectorFactory.class).create (metadataConfiguration, JSONObject.class, jsonEncoder, context.metadataStoreCallback, context);
			final IConfiguration dataConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("data"));
			context.dataStoreCallback = new DataKVCallback ();
			context.dataStore = context.cloudlet.getConnectorFactory (IKvStoreConnectorFactory.class).create (dataConfiguration, byte[].class, nullEncoder, context.dataStoreCallback, context);
			final IConfiguration timelinesConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("timelines"));
			context.timelinesStoreCallback = new TimelinesKVCallback ();
			context.timelinesStore = context.cloudlet.getConnectorFactory (IKvStoreConnectorFactory.class).create (timelinesConfiguration, JSONObject.class, jsonEncoder, context.timelinesStoreCallback, context);
			final IConfiguration itemsConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("items"));
			context.itemsStoreCallback = new ItemsKVCallback ();
			context.itemsStore = context.cloudlet.getConnectorFactory (IKvStoreConnectorFactory.class).create (itemsConfiguration, JSONObject.class, jsonEncoder, context.itemsStoreCallback, context);
			final IConfiguration tasksConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("tasks"));
			context.tasksStoreCallback = new TasksKVCallback ();
			context.tasksStore = context.cloudlet.getConnectorFactory (IKvStoreConnectorFactory.class).create (tasksConfiguration, JSONObject.class, jsonEncoder, context.tasksStoreCallback, context);
			final IConfiguration urgentQueueConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("urgent"));
			context.urgentConsumerCallback = new UrgentConsumerCallback ();
			context.urgentConsumer = context.cloudlet.getConnectorFactory (IAmqpQueueConsumerConnectorFactory.class).create (urgentQueueConfiguration, JSONObject.class, jsonEncoder, context.urgentConsumerCallback, context);
			final IConfiguration batchQueueConfiguration = configuration.spliceConfiguration (ConfigurationIdentifier.resolveAbsolute ("batch"));
			context.batchConsumerCallback = new BatchConsumerCallback ();
			context.batchConsumer = context.cloudlet.getConnectorFactory (IAmqpQueueConsumerConnectorFactory.class).create (batchQueueConfiguration, JSONObject.class, jsonEncoder, context.batchConsumerCallback, context);
			return CallbackCompletion.createAndChained (context.metadataStore.initialize (), context.dataStore.initialize (), context.timelinesStore.initialize (), context.itemsStore.initialize (), context.tasksStore.initialize (), context.urgentConsumer.initialize (), context.batchConsumer.initialize ());
		}
		
		@Override
		public CallbackCompletion<Void> initializeSucceeded (final IndexerCloudletContext context, final CloudletCallbackCompletionArguments<IndexerCloudletContext> arguments)
		{
			this.logger.info ("Feeds IndexerCloudlet initialized successfully.");
			return ICallback.SUCCESS;
		}
	}
}

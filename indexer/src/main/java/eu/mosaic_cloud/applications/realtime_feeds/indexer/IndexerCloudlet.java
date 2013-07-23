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

import eu.mosaic_cloud.platform.implementation.v2.serialization.JsonDataEncoder;
import eu.mosaic_cloud.platform.implementation.v2.serialization.NullDataEncoder;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultCallback;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultCloudletCallback;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultCloudletContext;
import eu.mosaic_cloud.platform.v2.cloudlets.connectors.kvstore.KvStoreConnector;
import eu.mosaic_cloud.platform.v2.cloudlets.connectors.queue.QueueConsumerConnector;
import eu.mosaic_cloud.platform.v2.cloudlets.connectors.queue.QueueConsumerConnectorCallback;
import eu.mosaic_cloud.platform.v2.cloudlets.core.CloudletController;
import eu.mosaic_cloud.tools.callbacks.core.CallbackCompletion;

import org.json.JSONObject;


public class IndexerCloudlet
{
	public static class IndexerCloudletContext
				extends DefaultCloudletContext<IndexerCloudletContext>
	{
		public IndexerCloudletContext (final CloudletController<IndexerCloudletContext> cloudlet) {
			super (cloudlet);
		}
		
		QueueConsumerConnector<JSONObject, Void> batchConsumer;
		QueueConsumerConnectorCallback<IndexerCloudletContext, JSONObject, Void> batchConsumerCallback;
		CloudletController<IndexerCloudletContext> cloudlet;
		KvStoreConnector<byte[], UUID> dataStore;
		KvStoreConnector<JSONObject, Void> itemsStore;
		KvStoreConnector<JSONObject, UUID> metadataStore;
		KvStoreConnector<JSONObject, Void> tasksStore;
		KvStoreConnector<JSONObject, UUID> timelinesStore;
		QueueConsumerConnector<JSONObject, Void> urgentConsumer;
	}
	
	public static class LifeCycleHandler
				extends DefaultCloudletCallback<IndexerCloudletContext>
	{
		@Override
		public CallbackCompletion<Void> destroy (final IndexerCloudletContext context) {
			context.logger.info ("Feeds IndexerCloudlet is being destroyed.");
			return context.destroyConnectors (context.metadataStore, context.dataStore, context.timelinesStore, context.itemsStore, context.tasksStore, context.urgentConsumer, context.batchConsumer);
		}
		
		@Override
		public CallbackCompletion<Void> initialize (final IndexerCloudletContext context) {
			context.logger.info ("FeedIndexerCloudlet is being initialized.");
			context.metadataStore = context.createKvStoreConnector ("metadata", JSONObject.class, JsonDataEncoder.DEFAULT_INSTANCE, MetadataKVCallback.class);
			context.dataStore = context.createKvStoreConnector ("data", byte[].class, NullDataEncoder.DEFAULT_INSTANCE, DataKVCallback.class);
			context.timelinesStore = context.createKvStoreConnector ("timelines", JSONObject.class, JsonDataEncoder.DEFAULT_INSTANCE, TimelinesKVCallback.class);
			context.itemsStore = context.createKvStoreConnector ("items", JSONObject.class, JsonDataEncoder.DEFAULT_INSTANCE, ItemsKVCallback.class);
			context.tasksStore = context.createKvStoreConnector ("tasks", JSONObject.class, JsonDataEncoder.DEFAULT_INSTANCE, TasksKVCallback.class);
			context.urgentConsumer = context.createQueueConsumerConnector ("urgent", JSONObject.class, JsonDataEncoder.DEFAULT_INSTANCE, QueueConsumerCallback.class);
			context.batchConsumer = context.createQueueConsumerConnector ("urgent", JSONObject.class, JsonDataEncoder.DEFAULT_INSTANCE, QueueConsumerCallback.class);
			return context.initializeConnectors (context.metadataStore, context.dataStore, context.timelinesStore, context.itemsStore, context.tasksStore, context.urgentConsumer, context.batchConsumer);
		}
		
		@Override
		public CallbackCompletion<Void> initializeSucceeded (final IndexerCloudletContext context) {
			context.logger.info ("Feeds IndexerCloudlet initialized successfully.");
			return DefaultCallback.Succeeded;
		}
	}
}

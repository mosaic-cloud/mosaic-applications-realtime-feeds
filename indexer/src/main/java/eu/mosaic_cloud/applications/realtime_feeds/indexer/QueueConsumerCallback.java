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


import eu.mosaic_cloud.applications.realtime_feeds.indexer.IndexerCloudlet.IndexerCloudletContext;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultCallback;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultQueueConsumerConnectorCallback;
import eu.mosaic_cloud.tools.callbacks.core.CallbackCompletion;

import org.json.JSONObject;


public final class QueueConsumerCallback
			extends DefaultQueueConsumerConnectorCallback<IndexerCloudletContext, JSONObject, Void>
{
	@Override
	public CallbackCompletion<Void> consume (final IndexerCloudletContext context, final ConsumeArguments<JSONObject> arguments) {
		final JSONObject message = arguments.message;
		IndexWorkflow.indexNewFeed (context, message);
		if (arguments.connector == context.batchConsumer) {
			context.batchConsumer.acknowledge (arguments.token, null);
		} else if (arguments.connector == context.urgentConsumer) {
			context.urgentConsumer.acknowledge (arguments.token, null);
		}
		return DefaultCallback.Succeeded;
	}
}

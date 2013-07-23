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


import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import eu.mosaic_cloud.applications.realtime_feeds.indexer.IndexerCloudlet.IndexerCloudletContext;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultCallback;
import eu.mosaic_cloud.platform.tools.v2.cloudlets.callbacks.DefaultKvStoreConnectorCallback;
import eu.mosaic_cloud.tools.callbacks.core.CallbackCompletion;


public class DataKVCallback
			extends DefaultKvStoreConnectorCallback<IndexerCloudletContext, byte[], UUID>
{
	@Override
	public CallbackCompletion<Void> getFailed (final IndexerCloudletContext context, final GetFailedArguments<UUID> arguments) {
		final String key = arguments.key;
		context.logger.warn ("failed fetch ({}, {})", DataKVCallback.BUCKET_NAME, key);
		final Map<String, String> errorMssg = new HashMap<String, String> (4);
		errorMssg.put ("reason", "unexpected key-value store error");
		errorMssg.put ("message", arguments.error.toString ());
		errorMssg.put ("bucket", DataKVCallback.BUCKET_NAME);
		errorMssg.put ("key", key);
		IndexWorkflow.onIndexError (errorMssg);
		return DefaultCallback.Succeeded;
	}
	
	@Override
	public CallbackCompletion<Void> getSucceeded (final IndexerCloudletContext context, final GetSucceededArguments<byte[], UUID> arguments) {
		final String key = arguments.key;
		context.logger.debug ("succeeded fetch ({}, {})", DataKVCallback.BUCKET_NAME, key);
		IndexWorkflow.parseLatestFeed (arguments.value, arguments.extra);
		return DefaultCallback.Succeeded;
	}
	
	private static final String BUCKET_NAME = "feed-data";
}

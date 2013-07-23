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

import org.json.JSONException;
import org.json.JSONObject;


public final class MetadataKVCallback
			extends DefaultKvStoreConnectorCallback<IndexerCloudletContext, JSONObject, UUID>
{
	@Override
	public CallbackCompletion<Void> getFailed (final IndexerCloudletContext context, final GetFailedArguments<UUID> arguments) {
		final String key = arguments.key;
		context.logger.warn ("failed fetch ({}, {})", MetadataKVCallback.BUCKET_NAME, key);
		final Map<String, String> errorMssg = new HashMap<String, String> (4);
		errorMssg.put ("reason", "unexpected key-value store error");
		errorMssg.put ("message", arguments.error.toString ());
		errorMssg.put ("bucket", MetadataKVCallback.BUCKET_NAME);
		errorMssg.put ("key", key);
		IndexWorkflow.onIndexError (errorMssg);
		return DefaultCallback.Succeeded;
	}
	
	@Override
	public CallbackCompletion<Void> getSucceeded (final IndexerCloudletContext context, final GetSucceededArguments<JSONObject, UUID> arguments) {
		final String key = arguments.key;
		JSONObject value = arguments.value;
		context.logger.debug ("succeeded fetch ({}, {})", MetadataKVCallback.BUCKET_NAME, key);
		if (value == null) {
			value = new JSONObject ();
			try {
				value.put ("key", key);
				value.put ("sequence", 0);
			} catch (final JSONException e) {
				context.exceptions.traceIgnoredException (e);
			}
		}
		IndexWorkflow.findNewFeeds (value, arguments.extra);
		return DefaultCallback.Succeeded;
	}
	
	@Override
	public CallbackCompletion<Void> setFailed (final IndexerCloudletContext context, final SetFailedArguments<JSONObject, UUID> arguments) {
		final String key = arguments.key;
		context.logger.warn ("failed store ({}, {})", MetadataKVCallback.BUCKET_NAME, key);
		final Map<String, String> errorMssg = new HashMap<String, String> (4);
		errorMssg.put ("reason", "unexpected key-value store error");
		errorMssg.put ("message", arguments.error.toString ());
		errorMssg.put ("bucket", MetadataKVCallback.BUCKET_NAME);
		errorMssg.put ("key", key);
		IndexWorkflow.onIndexError (errorMssg);
		return DefaultCallback.Succeeded;
	}
	
	@Override
	public CallbackCompletion<Void> setSucceeded (final IndexerCloudletContext context, final SetSucceededArguments<JSONObject, UUID> arguments) {
		final String key = arguments.key;
		context.logger.debug ("succeeded store ({}, {})", MetadataKVCallback.BUCKET_NAME, key);
		IndexWorkflow.onMetadataStored (key, arguments.extra);
		return DefaultCallback.Succeeded;
	}
	
	private static final String BUCKET_NAME = "feed-metadata";
}

/*
 * #%L
 * mosaic-examples-realtime-feeds-indexer
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

package eu.mosaic_cloud.examples.realtime_feeds.indexer;


import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import eu.mosaic_cloud.cloudlets.connectors.kvstore.KvStoreCallbackCompletionArguments;
import eu.mosaic_cloud.examples.realtime_feeds.indexer.IndexerCloudlet.IndexerCloudletContext;
import eu.mosaic_cloud.tools.exceptions.core.FallbackExceptionTracer;
import eu.mosaic_cloud.tools.exceptions.tools.BaseExceptionTracer;
import eu.mosaic_cloud.tools.transcript.core.Transcript;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;

import com.sun.syndication.io.FeedException;


public class IndexWorkflow
{
	private IndexWorkflow (final IndexerCloudletContext context, final JSONObject recvMessage)
	{
		super ();
		this.parser = new FeedParser ();
		this.currentFeedMetaData = new JSONObject ();
		this.newFeedTask = new JSONObject ();
		this.newFeedItems = new JSONArray ();
		this.context = context;
		this.indexMessage = recvMessage;
		this.exceptions = FallbackExceptionTracer.defaultInstance;
	}
	
	private void doFeedDiff (final JSONObject fetchedData)
	{
		IndexWorkflow.logger.debug ("indexing " + IndexWorkflow.INDEX_TASK_TYPE + " step 4 (diff-ing latest feed) for " + this.key + "...");
		String currentKey, currentURL, currentFeed, currentFeedId;
		long currentTimestamp;
		int currentSequence;
		try {
			this.previousFeedMetaData = fetchedData;
			final int previousSequence = this.previousFeedMetaData.has ("sequence") ? this.previousFeedMetaData.getInt ("sequence") : 0;
			final long minItemTimestamp = this.previousFeedMetaData.has ("timestamp") ? this.previousFeedMetaData.getLong ("timestamp") : -1;
			long maxItemTimestamp = -1;
			maxItemTimestamp = minItemTimestamp;
			final List<Timeline.Entry> currentItems = new ArrayList<Timeline.Entry> ();
			for (final Timeline.Entry item : this.currentTimeline.getEntries ()) {
				if ((minItemTimestamp == -1) || (item.getTimestamp () > minItemTimestamp)) {
					currentItems.add (item);
					if ((maxItemTimestamp == -1) || (item.getTimestamp () > maxItemTimestamp)) {
						maxItemTimestamp = item.getTimestamp ();
					}
				}
			}
			if (currentItems.size () > 0) {
				// NOTE: setup meta-data
				currentKey = this.previousFeedMetaData.getString ("key");
				currentURL = this.indexMessage.getString ("url");
				currentFeed = currentKey;
				currentFeedId = this.currentTimeline.getId ();
				currentTimestamp = maxItemTimestamp;
				currentSequence = previousSequence + 1;
				this.currentFeedMetaData.put ("key", currentKey);
				this.currentFeedMetaData.put ("url", currentURL);
				this.currentFeedMetaData.put ("feed", currentFeed);
				this.currentFeedMetaData.put ("id", currentFeedId);
				this.currentFeedMetaData.put ("timestamp", currentTimestamp);
				this.currentFeedMetaData.put ("sequence", currentSequence);
				// NOTE: setup new timeline
				this.newTimeline = new JSONObject ();
				final String newTimelineKey = StoreUtils.generateFeedTimelineKey (currentURL, currentSequence);
				this.newTimeline.put ("key", newTimelineKey);
				this.newTimeline.put ("url", currentURL);
				this.newTimeline.put ("feed", currentFeed);
				this.newTimeline.put ("id", currentFeedId);
				this.newTimeline.put ("timestamp", currentTimestamp);
				// NOTE: generate keys for new items
				final JSONArray items = new JSONArray ();
				for (final Timeline.Entry item : currentItems) {
					final String itemKey = StoreUtils.generateFeedItemKey (currentURL, item.getId ());
					items.put (itemKey);
					item.setKey (itemKey);
					// NOTE: store item
					final JSONObject json = item.convertToJson ();
					json.put ("feed", currentFeed);
					this.newFeedItems.put (json);
					this.context.itemsStore.set (itemKey, json, null);
				}
				this.newTimeline.put ("items", items);
				this.currentFeedMetaData.put ("timelines", this.newTimeline.getString ("key"));
				this.context.timelinesStore.set (newTimelineKey, this.newTimeline, this.key);
			} else {
				this.currentFeedMetaData = this.previousFeedMetaData;
				this.storeIndexOutcome ();
			}
			this.indexDone = true;
		} catch (final JSONException e) {
			this.exceptions.traceIgnoredException (e);
		}
	}
	
	/**
	 * Fetches latest feed data from the feeds-data bucket in the key-value
	 * store.
	 * 
	 */
	private void fetchLatestFeed ()
	{
		try {
			// FIXME: we should check if this feed isn't still pending for indexing...
			IndexWorkflow.logger.info ("New indexer created for feed " + this.indexMessage.getString ("url") + " ...");
			IndexWorkflow.logger.debug ("indexing " + this.indexMessage.getString ("url") + " (from data) step 2 (fetching latest data) for " + this.key + "...");
			this.context.dataStore.get (this.indexMessage.getString ("data"), this.key);
		} catch (final JSONException e) {
			this.handleError (e);
		}
	}
	
	private void handleError (final Exception e)
	{
		final Map<String, String> errorMssg = new HashMap<String, String> ();
		errorMssg.put ("reason", "unexpected parsing error");
		errorMssg.put ("message", e.getMessage ());
		IndexWorkflow.onIndexError (errorMssg);
		this.exceptions.traceIgnoredException (e);
	}
	
	private void handleMetadataStored (final KvStoreCallbackCompletionArguments<JSONObject, UUID> arguments)
	{
		if (this.indexDone) {
			this.storeIndexOutcome ();
		} else {
			this.context.metadataStore.get (arguments.getKey (), this.key);
		}
	}
	
	private void handleMetadataUpdate ()
	{
		IndexWorkflow.logger.debug ("indexing " + IndexWorkflow.INDEX_TASK_TYPE + " step 5 (updating meta-data) for " + this.key + "...");
		try {
			this.context.metadataStore.set (this.currentFeedMetaData.getString ("key"), this.currentFeedMetaData, this.key);
		} catch (final JSONException e) {
			this.exceptions.traceIgnoredException (e);
		}
	}
	
	private void indexFeed ()
			throws JSONException
	{
		final String feedKey = StoreUtils.generateFeedKey (this.indexMessage.getString ("url"));
		IndexWorkflow.logger.debug ("indexing " + IndexWorkflow.INDEX_TASK_TYPE + " step 3 (fetching latest meta-data) for " + this.key + "...");
		// FIXME: ??? (I don't remember what the problem was...)
		this.context.metadataStore.get (feedKey, this.key);
	}
	
	/**
	 * Parses latest fetched data.
	 * 
	 * @param fetchedData
	 *            the fetched data
	 */
	private void parseFeed (final byte[] fetchedData)
	{
		try {
			IndexWorkflow.logger.debug ("indexing " + this.indexMessage.getString ("url") + " (from data) step 2 (parsing latest data) for " + this.key + "...");
			final byte[] data = fetchedData;
			this.currentTimeline = this.parser.parseFeed (data);
			this.indexFeed ();
		} catch (final IOException e) {
			this.handleError (e);
		} catch (final FeedException e) {
			this.handleError (e);
		} catch (final JSONException e) {
			this.handleError (e);
		}
	}
	
	private void storeIndexOutcome ()
	{
		IndexWorkflow.logger.debug ("indexing " + IndexWorkflow.INDEX_TASK_TYPE + " step 6 (updating index task) for " + this.key + "...");
		try {
			final String feedTaskKey = StoreUtils.generateFeedTaskKey (this.indexMessage.getString ("url"), IndexWorkflow.INDEX_TASK_TYPE);
			this.newFeedTask.put ("key", feedTaskKey);
			this.newFeedTask.put ("type", IndexWorkflow.INDEX_TASK_TYPE);
			this.newFeedTask.put ("feed", this.currentFeedMetaData.get ("key"));
			this.newFeedTask.put ("url", this.indexMessage.getString ("url"));
			this.newFeedTask.put ("currentMetaData", this.currentFeedMetaData);
			this.newFeedTask.put ("previousMetaData", this.previousFeedMetaData);
			this.newFeedTask.put ("timeline", this.newTimeline);
			final JSONArray items = new JSONArray ();
			for (int i = 0; i < this.newFeedItems.length (); i++) {
				final JSONObject item = this.newFeedItems.getJSONObject (i);
				items.put (item.getString ("key"));
			}
			this.newFeedTask.put ("items", items);
			final Object error = null;
			this.newFeedTask.put ("error", error);
			this.context.tasksStore.set (feedTaskKey, this.newFeedTask, null);
		} catch (final JSONException e) {
			this.exceptions.traceIgnoredException (e);
		}
	}
	
	public static void findNewFeeds (final JSONObject fetchedData, final Object extra)
	{
		IndexWorkflow.getIndexer ((UUID) extra).doFeedDiff (fetchedData);
	}
	
	public static void indexNewFeed (final IndexerCloudletContext context, final JSONObject recvMessage)
	{
		final IndexWorkflow aIndexer = IndexWorkflow.createIndexer (context, recvMessage);
		aIndexer.fetchLatestFeed ();
	}
	
	public static void onIndexError (final Map<String, String> errorMessages)
	{
		IndexWorkflow.logger.error ("error encountered:");
		for (final Map.Entry<String, String> entry : errorMessages.entrySet ()) {
			IndexWorkflow.logger.error ("    {} -- {}", entry.getKey (), entry.getValue ());
		}
	}
	
	public static void onMetadataStored (final KvStoreCallbackCompletionArguments<JSONObject, UUID> arguments)
	{
		IndexWorkflow.getIndexer (arguments.getExtra ()).handleMetadataStored (arguments);
	}
	
	/**
	 * Parses latest fetched data.
	 * 
	 * @param fetchedData
	 *            the fetched data
	 */
	public static void parseLatestFeed (final byte[] fetchedData, final UUID extra)
	{
		IndexWorkflow.getIndexer (extra).parseFeed (fetchedData);
	}
	
	public static void updateFeedMetadata (final UUID extra)
	{
		IndexWorkflow.getIndexer (extra).handleMetadataUpdate ();
	}
	
	private static final IndexWorkflow createIndexer (final IndexerCloudletContext context, final JSONObject recvMessage)
	{
		final IndexWorkflow aIndexer = new IndexWorkflow (context, recvMessage);
		aIndexer.key = UUID.randomUUID ();
		IndexWorkflow.indexers.put (aIndexer.key, aIndexer);
		return aIndexer;
	}
	
	private static final IndexWorkflow getIndexer (final UUID key)
	{
		return IndexWorkflow.indexers.get (key);
	}
	
	private final IndexerCloudletContext context;
	private JSONObject currentFeedMetaData;
	private Timeline currentTimeline;
	private final BaseExceptionTracer exceptions;
	private boolean indexDone = false;
	private final JSONObject indexMessage;
	private UUID key;
	private final JSONArray newFeedItems;
	private final JSONObject newFeedTask;
	private JSONObject newTimeline;
	private final FeedParser parser;
	private JSONObject previousFeedMetaData;
	private static final String INDEX_TASK_TYPE = "index-data";
	private static final Map<UUID, IndexWorkflow> indexers = new HashMap<UUID, IndexWorkflow> ();
	private static final Logger logger = Transcript.create (IndexWorkflow.class).adaptAs (Logger.class);
}

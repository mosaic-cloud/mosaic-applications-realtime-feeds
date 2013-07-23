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


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import eu.mosaic_cloud.tools.exceptions.core.FallbackExceptionTracer;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


public class Timeline
{
	public Timeline (final String id, final String url, final long timestamp) {
		super ();
		this.id = id;
		this.url = url;
		this.timestamp = timestamp;
		this.entries = new ArrayList<Entry> ();
	}
	
	public Entry addEntry (final String entryId, final String title, final String titleType, final String content, final String contentType, final long entryTimestamp, final String authorName, final String authorEmail, final String authorURI) {
		final Entry entry = new Entry (entryId, title, titleType, content, contentType, entryTimestamp, authorName, authorEmail, authorURI);
		this.entries.add (entry);
		return entry;
	}
	
	public List<Entry> getEntries () {
		return this.entries;
	}
	
	public String getId () {
		return this.id;
	}
	
	public long getTimestamp () {
		return this.timestamp;
	}
	
	public String getUrl () {
		return this.url;
	}
	
	private final List<Entry> entries;
	private final String id;
	private final long timestamp;
	private final String url;
	
	class Entry
	{
		public Entry (final String id, final String title, final String titleType, final String content, final String contentType, final long timestamp, final String authorName, final String authorEmail, final String authorURI) {
			super ();
			this.id = id;
			this.title = title;
			this.titleType = titleType;
			this.content = content;
			this.contentType = contentType;
			this.timestamp = timestamp;
			this.authorName = authorName;
			this.authorEmail = authorEmail;
			this.authorURI = authorURI;
			this.links = new HashMap<String, String> ();
		}
		
		public void addLink (final String linkKey, final String linkRef) {
			this.links.put (linkKey, linkRef);
		}
		
		public JSONObject convertToJson () {
			final JSONObject json = new JSONObject ();
			try {
				json.put ("id", this.id);
				final JSONArray linksAlt = new JSONArray ();
				final JSONArray linksImg = new JSONArray ();
				for (final Map.Entry<String, String> link : this.links.entrySet ()) {
					if (link.getKey ().equalsIgnoreCase ("image")) {
						linksImg.put (link.getValue ());
					} else if (link.getKey ().equalsIgnoreCase ("alternate")) {
						linksAlt.put (link.getValue ());
					}
				}
				json.put ("links:alternate", linksAlt);
				json.put ("links:image", linksImg);
				json.put ("title", this.title);
				json.put ("title:type", this.titleType);
				json.put ("content", this.content);
				json.put ("content:type", this.contentType);
				json.put ("timestamp", this.timestamp);
				json.put ("author:name", this.authorName);
				json.put ("author:email", this.authorEmail);
				json.put ("author:uri", this.authorURI);
				json.put ("url", Timeline.this.getUrl ());
				json.put ("key", this.key);
			} catch (final JSONException e) {
				FallbackExceptionTracer.defaultInstance.traceIgnoredException (e);
			}
			return json;
		}
		
		public String getAuthorEmail () {
			return this.authorEmail;
		}
		
		public String getAuthorName () {
			return this.authorName;
		}
		
		public String getAuthorURI () {
			return this.authorURI;
		}
		
		public String getContent () {
			return this.content;
		}
		
		public String getContentType () {
			return this.contentType;
		}
		
		public String getId () {
			return this.id;
		}
		
		public String getKey () {
			return this.key;
		}
		
		public Map<String, String> getLinks () {
			return this.links;
		}
		
		public long getTimestamp () {
			return this.timestamp;
		}
		
		public String getTitle () {
			return this.title;
		}
		
		public String getTitleType () {
			return this.titleType;
		}
		
		public void setKey (final String key) {
			this.key = key;
		}
		
		private final String authorEmail;
		private final String authorName;
		private final String authorURI;
		private final String content;
		private final String contentType;
		private final String id;
		private String key;
		private final Map<String, String> links;
		private final long timestamp;
		private final String title;
		private final String titleType;
	}
}

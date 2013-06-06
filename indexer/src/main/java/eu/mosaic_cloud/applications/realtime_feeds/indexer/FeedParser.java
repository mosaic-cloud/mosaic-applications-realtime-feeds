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


import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.Callable;

import eu.mosaic_cloud.tools.threading.tools.Threading;

import com.sun.syndication.feed.atom.Feed;
import com.sun.syndication.feed.synd.SyndContent;
import com.sun.syndication.feed.synd.SyndEntry;
import com.sun.syndication.feed.synd.SyndFeed;
import com.sun.syndication.feed.synd.SyndLink;
import com.sun.syndication.feed.synd.SyndPerson;
import com.sun.syndication.io.FeedException;
import com.sun.syndication.io.SyndFeedInput;
import com.sun.syndication.io.XmlReader;


public class FeedParser
{
	public FeedParser ()
	{
		this.input = new SyndFeedInput (true);
		this.input.setPreserveWireFeed (true);
	}
	
	public Timeline parseFeed (final byte[] xmlEntry)
			throws IOException,
				FeedException
	{
		// NOTE: Load the feed, regardless of RSS or Atom type
		final XmlReader reader = new XmlReader (new ByteArrayInputStream (xmlEntry));
		final SyndFeed feed;
		// FIXME: This class-loader handling should be properly addressed...
		try {
			feed = Threading.executeWithCurrentThreadClassLoader (FeedParser.class.getClassLoader (), new Callable<SyndFeed> () {
				@Override
				public SyndFeed call ()
						throws Exception
				{
					return FeedParser.this.input.build (reader);
				}
			});
		} catch (final FeedException exception) {
			throw (exception);
		} catch (final IOException exception) {
			throw (exception);
		} catch (final Exception exception) {
			throw new Error (exception);
		}
		// NOTE: check feed type, only ATOM is accepted
		Feed atomFeed = null;
		if (feed.getFeedType ().toLowerCase ().startsWith ("atom")) {
			atomFeed = (Feed) feed.originalWireFeed ();
		} else {
			throw new FeedException ("Only ATOM feeds can be parsed.");
		}
		final Timeline timeline = new Timeline (atomFeed.getId (), feed.getLink (), atomFeed.getUpdated ().getTime ());
		@SuppressWarnings ("unchecked") final List<SyndEntry> entries = feed.getEntries ();
		for (final SyndEntry entry : entries) {
			String authorName = null;
			String authorEmail = null;
			String authorURI = null;
			SyndPerson author = null;
			if (entry.getAuthors ().size () > 0) {
				author = (SyndPerson) entry.getAuthors ().get (0);
				authorName = author.getName ();
				authorEmail = author.getEmail ();
				authorURI = author.getUri ();
			}
			String content = null;
			String contentType = null;
			SyndContent contentOb = null;
			if (entry.getContents ().size () > 0) {
				contentOb = (SyndContent) entry.getContents ().get (0);
				content = contentOb.getValue ();
				contentType = contentOb.getType ();
			}
			final String title = entry.getTitleEx ().getValue ();
			final String titleType = entry.getTitleEx ().getType ();
			final Timeline.Entry tEntry = timeline.addEntry (entry.getUri (), title, titleType, content, contentType, entry.getPublishedDate ().getTime (), authorName, authorEmail, authorURI);
			@SuppressWarnings ("unchecked") final List<SyndLink> links = entry.getLinks ();
			for (final SyndLink link : links) {
				tEntry.addLink (link.getRel (), link.getHref ());
			}
		}
		return timeline;
	}
	
	/** Parses RSS or Atom to instantiate a SyndFeed. */
	private final SyndFeedInput input;
}

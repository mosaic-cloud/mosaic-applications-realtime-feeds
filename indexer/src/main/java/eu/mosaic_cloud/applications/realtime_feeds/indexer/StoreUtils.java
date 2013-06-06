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


import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;


public class StoreUtils
{
	public static final String generateFeedItemKey (final String url, final String itemId)
	{
		return StoreUtils.generateTwoStringKey (url, itemId);
	}
	
	public static final String generateFeedKey (final String url)
	{
		String key = null;
		try {
			MessageDigest md5;
			md5 = MessageDigest.getInstance ("MD5");
			md5.update (url.getBytes (), 0, url.length ());
			final BigInteger i = new BigInteger (1, md5.digest ());
			key = String.format ("%1$032X", i).toLowerCase ();
		} catch (final NoSuchAlgorithmException e) {
			throw new IllegalStateException ();
		}
		return key;
	}
	
	public static final String generateFeedTaskKey (final String url, final String type)
	{
		return StoreUtils.generateTwoStringKey (url, type);
	}
	
	public static final String generateFeedTimelineKey (final String url, final int sequence)
	{
		final String seq = String.format ("%1$08x", Integer.valueOf (sequence)).toLowerCase ();
		return StoreUtils.generateTwoStringKey (url, seq);
	}
	
	public static final String generateKey (final String string)
	{
		try {
			final MessageDigest md5 = MessageDigest.getInstance ("MD5");
			md5.update (string.getBytes (), 0, string.length ());
			final BigInteger i = new BigInteger (1, md5.digest ());
			final String timelineKey = String.format ("%1$032X", i).toLowerCase ();
			return timelineKey;
		} catch (final Exception e) {
			throw new IllegalStateException ();
		}
	}
	
	private static String generateTwoStringKey (final String string1, final String string2)
	{
		String key = null;
		try {
			MessageDigest md5;
			md5 = MessageDigest.getInstance ("MD5");
			md5.update (string1.getBytes (), 0, string1.length ());
			md5.update ("#".getBytes (), 0, 1);
			md5.update (string2.getBytes (), 0, string2.length ());
			final BigInteger i = new BigInteger (1, md5.digest ());
			key = String.format ("%1$032X", i).toLowerCase ();
		} catch (final NoSuchAlgorithmException e) {
			throw new IllegalStateException ();
		}
		return key;
	}
}

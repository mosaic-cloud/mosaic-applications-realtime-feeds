package eu.mosaic_cloud.realtime_feeds.frontend;

import java.io.IOException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.sql.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import javax.servlet.ServletException;

import com.google.common.base.Preconditions;
import com.basho.riak.pbc.RiakClient;
import com.basho.riak.pbc.RiakObject;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import eu.mosaic_cloud.components.core.ComponentCallReply;
import eu.mosaic_cloud.components.jetty.JettyComponent;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@SuppressWarnings("serial")
public class FeedsServlet extends JsonServlet {
	
	final Logger       logger = LoggerFactory.getLogger (FeedsServlet.class);
	final String     riakAddr;
	final Integer    riakPort;
	final String   rabbitAddr;
	final Integer  rabbitPort;
	final String   feedBucket;
	final Integer   feedLimit;
	
	public FeedsServlet() {
		this.feedBucket = new String("feed-metadata");
		this.feedLimit = new Integer(10);
		if (JettyComponent.component.isActive ()) {
			try {
				{
					ComponentCallReply reply = JettyComponent.component.call (rabbitGroup, "mosaic-rabbitmq:get-broker-endpoint", null).get (12000, TimeUnit.MILLISECONDS);
					Preconditions.checkState (reply.ok);
					Map<?, ?> outputs = (Map) reply.outputsOrError;
					rabbitAddr = (String) outputs.get ("ip");
					rabbitPort = (Integer) outputs.get ("port");
					logger.info ("resolved Rabbit on `{}:{}`", rabbitAddr, rabbitPort);
				}
				{
					ComponentCallReply reply = JettyComponent.component.call (riakGroup, "mosaic-riak-kv:get-store-pb-endpoint", null).get (12000, TimeUnit.MILLISECONDS);
					Preconditions.checkState (reply.ok);
					Map<?, ?> outputs = (Map) reply.outputsOrError;
					riakAddr = (String) outputs.get ("ip");
					riakPort = (Integer) outputs.get ("port");
					logger.info ("resolved Riak on `{}:{}`", riakAddr, riakPort);
				}
			} catch (Throwable e) {
				logger.error ("failed resolving resources; terminating!", e);
				JettyComponent.component.terminate ();
				throw new IllegalStateException();
			}
		} else {
			this.riakAddr = new String("127.0.0.1");
			this.riakPort = new Integer(22652);
			this.rabbitAddr = new String("127.0.0.1");
			this.rabbitPort = new Integer(21688);
		}
		/*
		try {
			this.riak = new RiakClient(riakAddr, riakPort);
		}
		catch (Exception e) {
			logger.error ("failed resolving resources; terminating!", e);
			JettyComponent.component.terminate ();
		}
		*/
	}
	
	@Override
	JSONObject handleRequest(JSONObject jsonRequest) throws JSONException,
			ServletException, IOException {
		logger.debug("handling request...");
		try {
			String action  = jsonRequest.getString("action");
			String feedUrl = jsonRequest.getJSONObject("arguments").getString("url");
			if(action.equals("register") || action.equals("refresh")) {
				String url = jsonRequest.getJSONObject("arguments").getString("url");
				String seq = jsonRequest.getJSONObject("arguments").getString("sequence");
				return interrogateRiak(checkSum(url), url, seq);
			}
			else {
				JSONObject act = new JSONObject();
				act.put("action", "not supported");
				return act;
			}
		}
		catch (Exception e) {
			logger.error("error encountered while handling request...", e.getMessage());
			return errorJson(e.getMessage());
		}
	}
	
	JSONObject publishNewFeedRequest(String md5, String url) {
		// TODO: publish to rabbitMQ and return json object so user can w8 ...
		JSONObject published = new JSONObject();
		
		try {
			// publish to rabbitMQ
			String EXCHANGE_NAME = new String("feeds.fetch-data");
			ConnectionFactory factory = new ConnectionFactory();
	        factory.setHost(rabbitAddr);
	        factory.setPort(rabbitPort);
	        Connection connection = factory.newConnection();
	        Channel channel = connection.createChannel();
	        JSONObject feedUrl = new JSONObject();
	        feedUrl.put("url", url);
	        AMQP.BasicProperties prop = new AMQP.BasicProperties.Builder ().contentType("application/json").build();
	        channel.basicPublish(EXCHANGE_NAME, "urgent", prop, feedUrl.toString().getBytes());
	        channel.close();
	        connection.close();
	        published.put("error", "published");
			return published;
		}
		catch (Exception e) {
			logger.error("error encountered while publishing url: {} ({}) ", url, md5);
			return errorJson(e.getCause().toString());
		}
	}
	
	JSONObject interrogateRiak(String md5, String url, String seque) throws JSONException,
			ServletException, IOException {
		Integer seq = Integer.parseInt(seque);
		publishNewFeedRequest(md5, url);
		JSONObject feed     = new JSONObject();
		JSONObject result   = new JSONObject();
		JSONArray  jsonArr  = new JSONArray();
		
		try {
			RiakClient riak = new RiakClient(riakAddr, riakPort);
			RiakObject[] feeds = riak.fetch(feedBucket, md5); // I should be only one bucket for a url ...			
			
			Integer sequence = null;
			if(feeds.length > 0) {
				feed = new JSONObject(feeds[0].getValue().toStringUtf8());
				sequence = feed.getInt("sequence");
			}
			if (sequence == null)
				sequence = 0;
			result.put("sequence", sequence.toString());
			
			int count = 0;
			out: while(true) {
				if(sequence <= seq) {
					break;
				}
				String hexa = String.format("#%08x", sequence);
				String timeLineKey = checkSum(url + hexa);
				logger.debug("timeline: {} ({})", sequence, timeLineKey);
				RiakObject[] feedTimeLine = riak.fetch("feed-timelines", timeLineKey);
				if(feedTimeLine.length == 0) {
					continue out;
				}
				JSONObject feedItem = new JSONObject(feedTimeLine[0].getValue().toStringUtf8());
				JSONArray feedItems = feedItem.getJSONArray("items");
				for(int index = 0; index < feedItems.length(); index++) {
					JSONObject tempObj = new JSONObject();
					String itemKey = feedItems.getString(index);
					RiakObject riakFeedJson = riak.fetch("feed-items", itemKey)[0];
					JSONObject feedJson = new JSONObject(riakFeedJson.getValue().toStringUtf8());
					tempObj.put("img", feedJson.getJSONArray("links:image").getString(0));
					tempObj.put("title", feedJson.getString("title"));
					tempObj.put("link", feedJson.getString("author:uri"));
					jsonArr.put(tempObj);
					logger.debug("item: {}", tempObj.toString());
					count++;
					if(count >= feedLimit) {
						break out;
					}
					tempObj = null;
				}
				sequence--;
			}
			result.put("entry", jsonArr);
			return result;
		}		
		catch (Exception e) {
			logger.error("error encountered while interogating riak", e);
			return errorJson(e.getMessage());
		}
	}

	String checkSum(String key) {
		try {
			MessageDigest md5 = MessageDigest.getInstance("MD5");
			md5.update(key.getBytes(), 0, key.length());
			BigInteger i = new BigInteger(1, md5.digest());
			String timelineKey = String.format("%1$032X", i).toLowerCase();
			return timelineKey;
		}
		catch (Exception e) {
			return null;
		}
	}

	JSONObject errorJson(String error) {
		JSONObject err = new JSONObject();
		
		try {
			err.put("error", error);
		} catch (JSONException e) {
			throw (new RuntimeException(e));
		}
		return err;
	}
	
	static String riakGroup = "9cdce23e78027ef6a52636da7db820c47e695d11";
	static String rabbitGroup = "8cd74b5e4ecd322fd7bbfc762ed6cf7d601eede8";
}

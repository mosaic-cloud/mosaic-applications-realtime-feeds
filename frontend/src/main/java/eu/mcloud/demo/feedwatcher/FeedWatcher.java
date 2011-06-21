package eu.mcloud.demo.feedwatcher;

import java.io.IOException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.sql.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.LoggerFactory;
import com.basho.riak.pbc.*;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.Channel;
import org.slf4j.*;


@SuppressWarnings("serial")
public class FeedWatcher extends JSONServlet {
	private Logger logger = LoggerFactory.getLogger (FeedWatcher.class);
	private HashMap<String, Date> timeStamps = new HashMap<String, Date>();
	// global stuff 
	String     riakAddr;
	Integer    riakPort;
	String   feedBucket;
	Integer    sequence;
	Integer   feedLimit;
	RiakClient     riak;
	
	public FeedWatcher() {
		this.riakAddr = new String("127.0.0.1");
		this.riakPort = new Integer(22652);
		this.feedBucket = new String("feed-metadata");
		this.sequence = new Integer(0);
		this.feedLimit = new Integer(10);
		try {
			this.riak = new RiakClient(this.riakAddr, this.riakPort);
		}
		catch (Exception e) {
			// TODO handle riak exception ...
		}
	}
	
	public FeedWatcher(String riakHost, Integer riakPort, String riakBucket, Integer feedLimit) {
		this.riakAddr = riakHost;  
		this.riakPort = riakPort;
		this.feedBucket = riakBucket;
		this.sequence = new Integer(0);
		this.feedLimit = feedLimit;
	}
	
	@Override
	JSONObject handleRequest(JSONObject jsonRequest) throws JSONException,
			ServletException, IOException {
		logger.info("new request");
		try {
			String action  = jsonRequest.getString("action");
			String feedUrl = jsonRequest.getJSONObject("arguments").getString("url");
			if(action.equals("register") || action.equals("refresh")) {
				String url = jsonRequest.getJSONObject("arguments").getString("url");
				String seq = jsonRequest.getJSONObject("arguments").getString("sequence");
				logger.info("feed request sequence");
				return interrogateRiak(checkSum(url), url, seq);
			}
			else {
				JSONObject act = new JSONObject();
				act.put("action", "not supported");
				return act;
			}
		}
		catch (Exception e) {
			logger.error(e.getMessage());
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
	        factory.setHost("127.0.0.1");
	        factory.setPort(21688);
	        Connection connection = factory.newConnection();
	        Channel channel = connection.createChannel();
	        JSONObject feedUrl = new JSONObject();
	        feedUrl.put("url", url);
	        AMQP.BasicProperties prop = new AMQP.BasicProperties.Builder ().contentType("application/json").build();
	        channel.basicPublish(EXCHANGE_NAME, "urgent", prop, feedUrl.toString().getBytes());
	        logger.debug("JSON : {}", feedUrl.toString(2));
	        channel.close();
	        connection.close();
	        published.put("error", "published");
			logger.debug("Published new feed request {}", url);
			return published;
		}
		catch (Exception e) {
			logger.error("Failed to publish feed request\turl: {} md5 {} ", url, md5);
			return errorJson(e.getCause().toString());
		}
	}
	
	JSONObject interrogateRiak(String md5, String url, String seque) throws JSONException,
			ServletException, IOException {
		// interogate riak for a refresh request ...
		if(feedTimestamp(url, new Date(2011, 6, 20))) {
			System.out.println("wtf");
		}
		else {
			System.out.println("it worked ...");
		}
		Integer seq = Integer.parseInt(seque);
		publishNewFeedRequest(md5, url);
		JSONObject feed     = new JSONObject();
		JSONObject result   = new JSONObject();
		JSONArray  jsonArr  = new JSONArray();
		
		try {
			//RiakClient riak = new RiakClient(riakAddr, riakPort);
			RiakObject[] feeds = riak.fetch(feedBucket, md5); // I should be only one bucket for a url ...			
			
			if(feeds.length <= 0) {
				return publishNewFeedRequest(md5, url);
			}
			else {
				feed = new JSONObject(feeds[0].getValue().toStringUtf8());
			}
			sequence = feed.getInt("sequence");
			
			if(sequence <= seq) {
				return publishNewFeedRequest(md5, url);
			}
			else {
				result.put("sequence", sequence.toString());
				for( ; feedLimit >= 1; sequence--) {
					
					if(sequence <= seq) {
						break;
					}
					String hexa = String.format("#%08x", sequence);
					String timeLineKey = checkSum(url + hexa);
					RiakObject[] feedTimeLine = riak.fetch("feed-timelines", timeLineKey);
					if(feedTimeLine.length <= 0) {
						continue;
					}
					JSONObject feedItem = new JSONObject(feedTimeLine[0].getValue().toStringUtf8());
					JSONArray feedItems = feedItem.getJSONArray("items");					
					for(int index = 0; feedItems.length() - 1 >= index; index++) {
						JSONObject tempObj = new JSONObject();
						String itemKey = feedItems.getString(index);
						RiakObject riakFeedJson = riak.fetch("feed-items", itemKey)[0];
						JSONObject feedJson = new JSONObject(riakFeedJson.getValue().toStringUtf8());
						tempObj.put("img", feedJson.getJSONArray("links:image").getString(0));
						tempObj.put("title", feedJson.getString("title"));
						tempObj.put("link", feedJson.getString("author:uri"));
						jsonArr.put(tempObj);
						feedLimit -= 1;
						if(feedLimit <= 0) break;
						tempObj = null;
					}
					result.put("entry", jsonArr);
				}
				feedLimit = 100;
			}
			return result;
		}		
		catch (Exception e) {
			logger.error("Failed to interogate riak\triak addr: {} riak port: ", riakAddr, riakPort.toString());
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
			return err;
		}
		catch (Exception e) {
			logger.error("Failed to create json object from an error\t * error: ", error);
			return err;
		}
	}
	
	public synchronized boolean feedTimestamp(String feed, Date time) {
		// TODO: check / update hashmap with url: timestamp instead of interrogating riak ... 
		return false;
	}
}
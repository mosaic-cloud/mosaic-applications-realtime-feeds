package eu.mosaic_cloud.realtime_feeds.frontend;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONException;
import org.json.JSONObject;

public abstract class JsonServlet extends HttpServlet {
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		try {
			_handleRequest(req, resp);
		} catch (JSONException e) {
			throw new IOException(e);
		}
	}
	
	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		try {
			_handleRequest(req, resp);
		} catch (JSONException e) {
			throw new IOException(e);
		}
	}
	
	protected void _handleRequest(HttpServletRequest req, HttpServletResponse resp) throws JSONException, IOException, ServletException {
		String[] requestFields = req.getParameterValues("request");
		if (requestFields == null || requestFields.length == 0) {
			// TODO: Handle this
			return;
		}
		String request = requestFields[0];
		JSONObject jsonRequest = new JSONObject(request);
		JSONObject jsonResponse = handleRequest(jsonRequest);
		if (jsonResponse != null) {
			String response = jsonResponse.toString();
			resp.setContentType("application/json");
			resp.getWriter().write(response);
		}
	}
	
	abstract JSONObject handleRequest(JSONObject jsonRequest) throws JSONException, ServletException, IOException;
}

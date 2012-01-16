
package eu.mosaic_cloud.realtime_feeds.frontend;


import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.common.base.Preconditions;
import org.json.JSONException;
import org.json.JSONObject;


public abstract class JsonServlet
		extends HttpServlet
{
	@Override
	protected void doGet (final HttpServletRequest req, final HttpServletResponse resp)
			throws ServletException,
				IOException
	{
		try {
			this.handleRequest (req, resp);
		} catch (final JSONException e) {
			throw new IOException (e);
		}
	}
	
	@Override
	protected void doPost (final HttpServletRequest req, final HttpServletResponse resp)
			throws ServletException,
				IOException
	{
		try {
			this.handleRequest (req, resp);
		} catch (final JSONException e) {
			throw new IOException (e);
		}
	}
	
	protected abstract JSONObject handleRequest (JSONObject jsonRequest)
			throws JSONException,
				ServletException,
				IOException;
	
	private final void handleRequest (final HttpServletRequest req, final HttpServletResponse resp)
			throws JSONException,
				IOException,
				ServletException
	{
		final JSONObject jsonRequest;
		if ((req.getParameter ("url") != null) && (req.getParameter ("sequence") != null)) {
			final JSONObject jsonRequestArguments = new JSONObject ();
			jsonRequestArguments.put ("url", req.getParameter ("url"));
			jsonRequestArguments.put ("sequence", Integer.parseInt (req.getParameter ("sequence")));
			jsonRequest = new JSONObject ();
			jsonRequest.put ("action", "refresh");
			jsonRequest.put ("arguments", jsonRequestArguments);
		} else if (req.getParameter ("request") != null) {
			jsonRequest = new JSONObject (req.getParameter ("request"));
		} else {
			Preconditions.checkArgument (false, "invalid arguments");
			jsonRequest = null;
		}
		final JSONObject jsonResponse = this.handleRequest (jsonRequest);
		if (jsonResponse != null) {
			final String response = jsonResponse.toString ();
			resp.setContentType ("application/json");
			resp.getWriter ().write (response);
		}
	}
	
	private static final long serialVersionUID = 1L;
}

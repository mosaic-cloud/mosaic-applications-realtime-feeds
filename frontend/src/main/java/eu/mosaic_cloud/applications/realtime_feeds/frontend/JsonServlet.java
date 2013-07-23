/*
 * #%L
 * mosaic-applications-realtime-feeds-frontend
 * %%
 * Copyright (C) 2010 - 2012 Institute e-Austria Timisoara (Romania)
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

package eu.mosaic_cloud.applications.realtime_feeds.frontend;


import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONException;
import org.json.JSONObject;

import com.google.common.base.Preconditions;


public abstract class JsonServlet
			extends HttpServlet
{
	@Override
	protected void doGet (final HttpServletRequest req, final HttpServletResponse resp)
				throws ServletException, IOException {
		try {
			this.handleRequest (req, resp);
		} catch (final JSONException e) {
			throw (new IOException (e));
		}
	}
	
	@Override
	protected void doPost (final HttpServletRequest req, final HttpServletResponse resp)
				throws ServletException, IOException {
		try {
			this.handleRequest (req, resp);
		} catch (final JSONException e) {
			throw (new IOException (e));
		}
	}
	
	protected abstract JSONObject handleRequest (JSONObject jsonRequest)
				throws JSONException, ServletException, IOException;
	
	private final void handleRequest (final HttpServletRequest req, final HttpServletResponse resp)
				throws JSONException, IOException, ServletException {
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

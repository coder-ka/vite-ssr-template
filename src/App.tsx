import React from "react";
import { Router, Link, Route, Switch } from "wouter";
import { PageBase } from "./PageBase";

function App({ ssrPath }: { ssrPath?: string }) {
  return (
    <React.StrictMode>
      <html lang="en">
        <Router ssrPath={ssrPath}>
          <Switch>
            <Route path="/">
              <PageBase subtitle="home" description="this is home">
                <ul>
                  <li>
                    <Link href="/about">
                      <a className="text-blue-500 underline">About Us</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/users/john">
                      <a className="text-blue-500 underline">Profile</a>
                    </Link>
                  </li>
                </ul>
              </PageBase>
            </Route>
            <Route path="/about">
              <PageBase subtitle="home" description="this is home">
                <h1>About Us</h1>
              </PageBase>
            </Route>
            <Route path="/users/:name">
              {(params) => (
                <PageBase subtitle="home" description="this is home">
                  <body>
                    <div>Hello! My name is {params.name}!</div>
                  </body>
                </PageBase>
              )}
            </Route>
          </Switch>
        </Router>
      </html>
    </React.StrictMode>
  );
}

export default App;

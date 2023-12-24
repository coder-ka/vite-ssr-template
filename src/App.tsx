import { Link, Route } from "wouter";
import { Helmet } from "react-helmet";

function App() {
  return (
    <div>
      <Helmet
        htmlAttributes={{
          lang: "en",
        }}
      >
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Title</title>
        <meta name="description" content="Helmet application" />
      </Helmet>
      <Link href="/users/1">
        <a className="link">Profile</a>
      </Link>

      <Route path="/about">About Us</Route>
      <Route path="/users/:name">
        {(params) => <div>Hello, {params.name}!</div>}
      </Route>
    </div>
  );
}

export default App;

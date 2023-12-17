import { Link, Route } from "wouter";
import { Helmet } from "react-helmet";

function App() {
  return (
    <div>
      <Helmet>
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

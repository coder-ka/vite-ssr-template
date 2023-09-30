import { Link, Route } from "wouter";

function App() {
  return (
    <div>
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

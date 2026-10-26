import { Link } from "react-router";

export default function ProfilePage() {
  return (
    <section className="page">
      <span className="tag tag-react">Rendered by React</span>
      <h1>Profile</h1>
      <p>This page was migrated last sprint. Its Vue version was deleted the same day.</p>
      <Link to="/legacy/dashboard">Back to the dashboard (Vue)</Link>
    </section>
  );
}

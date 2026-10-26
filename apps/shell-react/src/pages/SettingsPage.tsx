import { useState } from "react";
import { Link } from "react-router";

export default function SettingsPage() {
  const [compact, setCompact] = useState(false);

  return (
    <section className="page">
      <span className="tag tag-react">Rendered by React</span>
      <h1>Settings</h1>
      <label className="field">
        <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
        Compact mode
      </label>
      <p>
        Links work across the boundary: <Link to="/legacy/reports?range=month">monthly report (Vue)</Link>
      </p>
    </section>
  );
}

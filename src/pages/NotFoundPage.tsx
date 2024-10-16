import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col gap-2 w-full items-start">
      404 not found
      <Link to="/">Home from Link</Link>
    </div>
  );
}

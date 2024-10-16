import { useParams } from "react-router-dom";

export default function ProfilePage() {
  const params = useParams<{ profileId: string }>();
  console.log(params);
  return <div>ProfilePage of {params?.profileId}</div>;
}

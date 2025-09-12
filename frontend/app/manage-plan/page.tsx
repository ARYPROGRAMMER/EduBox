import { getTemporaryAccessToken } from "@/actions/getTemporaryAccessToken";
import SchematicComponent from "@/components/schematic/SchematicComponent";

async function ManagePlan() {
  const accessToken = await getTemporaryAccessToken();

  if (!accessToken) {
    return (
      <div className="container mx-auto p-4 md:p-0">
        <h1 className="text-2xl font-bold mb-4 my-8">Manage Your Plan</h1>
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <p className="text-yellow-700">
            Unable to load billing information. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-0">
      <h1 className="text-2xl font-bold mb-4 my-8">Manage Your Plan</h1>
      <p className="text-gray-600 mb-8">
        Manage your subscription and billing details here.
      </p>

      <SchematicComponent accessToken={accessToken} />
    </div>
  );
}

export default ManagePlan;

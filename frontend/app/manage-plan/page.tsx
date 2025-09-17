import { getTemporaryAccessToken } from "@/actions/getTemporaryAccessToken";
import SchematicComponent from "@/components/schematic/SchematicComponent";
import ForceLight from "@/components/ForceLight";
import { LampContainer } from "@/components/ui/lamp";
import { AlertCircle } from "lucide-react";

export default async function ManagePlan() {
  const accessToken = await getTemporaryAccessToken();

  // ---------- Empty / error state ----------
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-yellow-300 bg-yellow-50 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Manage Your Plan
          </h1>
          <p className="text-yellow-700">
            Unable to load billing information. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Main view ----------
  return (
    <ForceLight>
      <section className="bg-gray-50">
        {/* Page heading */}
        <div className="max-w-5xl mx-auto px-4 pt-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Manage Your Plan
          </h1>
          <p className="mt-3 text-gray-600 text-base sm:text-lg">
            Update subscription and billing details anytime.
          </p>
        </div>

        {/* Decorative lamp bar */}
        <LampContainer className="min-h-[14vh] sm:min-h-[18vh] bg-gray-50 mt-6" />

        {/* Content card */}
        <div className="max-w-5xl mx-auto -mt-12 px-4 pb-12">
          <div className="rounded-xl bg-white shadow-md p-6 sm:p-8">
            <SchematicComponent accessToken={accessToken} />
          </div>
        </div>
      </section>
    </ForceLight>
  );
}

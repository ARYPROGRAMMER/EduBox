import { analyseYoutubeVideo } from "@/actions/analyseform";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";

function YoutubeVideoForm() {
  const placeholders = [
    "What's the first rule of Fight Club?",
    "Who is Tyler Durden?",
    "Where is Andrew Laeddis Hiding?",
    "Write a Javascript method to reverse a string",
    "How to assemble your own PC?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Use the animated input component only. It contains its own <form> and submit button. */}
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}

export default YoutubeVideoForm;

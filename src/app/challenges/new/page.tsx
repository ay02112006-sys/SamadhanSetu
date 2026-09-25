'use client';
// src/app/challenges/new/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const domains = [
  { label: "Education", value: "EDUCATION" },
  { label: "Healthcare", value: "HEALTHCARE" },
  { label: "Agriculture", value: "AGRICULTURE" },
  { label: "Water Management", value: "WATER" },
  { label: "Sanitation", value: "SANITATION" },
  { label: "Environment", value: "ENVIRONMENT" },
  { label: "Rural Livelihoods", value: "RURAL_LIVELIHOODS" },
  { label: "Accessibility", value: "ACCESSIBILITY" },
  { label: "Urban Infrastructure", value: "URBAN_INFRASTRUCTURE" },
  { label: "Public Services", value: "PUBLIC_SERVICES" },
  { label: "Other", value: "OTHER" },
];

export default function ReportChallengePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState({ state: "", district: "", city: "", address: "" });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // simple validation: size < 5MB, allowed types
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "video/mp4", "video/webm"];
      const invalid = files.find((f) => f.size > 5 * 1024 * 1024 || !allowed.includes(f.type));
      if (invalid) {
        setError("One or more files are invalid (type or size >5MB).");
        return;
      }
      setAttachments(files);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !domain) {
      setError("Title, description and domain are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Build attachment meta (no actual upload yet)
    const attachmentMeta = attachments.map((f) => ({ filename: f.name, contentType: f.type }));
    const payload = {
      title,
      description,
      domain,
      location,
      attachments: attachmentMeta,
    };

    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to submit challenge.");
      setSubmitting(false);
      return;
    }
    // redirect to detail page
    router.push(`/challenges/${data.data.challengeId}`);
  };

  return (
    <section className="container mx-auto py-8">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Report a Challenge</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block font-medium mb-1" htmlFor="title">
              Challenge Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {/* Domain */}
          <div>
            <label className="block font-medium mb-1" htmlFor="domain">
              Domain
            </label>
            <select
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a domain</option>
              {domains.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          {/* Location */}
          <fieldset className="border p-4 rounded">
            <legend className="font-medium">Location (optional)</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <input
                placeholder="State"
                value={location.state}
                onChange={(e) => setLocation({ ...location, state: e.target.value })}
                className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="District"
                value={location.district}
                onChange={(e) => setLocation({ ...location, district: e.target.value })}
                className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="City / Village"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
                className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="Address / Locality"
                value={location.address}
                onChange={(e) => setLocation({ ...location, address: e.target.value })}
                className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </fieldset>
          {/* Attachments */}
          <div>
            <label className="block font-medium mb-1" htmlFor="attachments">
              Attachments (optional)
            </label>
            <input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full"
            />
            {attachments.length > 0 && (
              <ul className="mt-2 list-disc list-inside">
                {attachments.map((f) => (
                  <li key={f.name}>{f.name} ({Math.round(f.size / 1024)} KB)</li>
                ))}
              </ul>
            )}
          </div>
          {/* Submit */}
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Challenge"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

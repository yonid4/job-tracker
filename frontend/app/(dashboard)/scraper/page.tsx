"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrapedJob } from "@/types";
import { scrapeJobsAction, saveScrapedJobAction, ScrapeParams } from "./actions";

const SITES = ["linkedin", "indeed", "glassdoor", "zip_recruiter"];

export default function ScraperPage() {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [sites, setSites] = useState<string[]>(["linkedin", "indeed"]);
  const [resultsPerSite, setResultsPerSite] = useState(20);
  const [isRemote, setIsRemote] = useState(false);
  const [jobType, setJobType] = useState("");
  const [hoursOld, setHoursOld] = useState(48);
  const [distance, setDistance] = useState(50);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapedJob[]>([]);
  const [scrapeErrors, setScrapeErrors] = useState<string[]>([]);
  const [topError, setTopError] = useState<string | null>(null);

  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingId, setSavingId] = useState<number | null>(null);

  function toggleSite(site: string) {
    setSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  }

  async function handleScrape() {
    if (!keywords.trim() || !location.trim()) return;
    if (sites.length === 0) return;

    setLoading(true);
    setTopError(null);
    setResults([]);
    setScrapeErrors([]);
    setSavedIds(new Set());

    const params: ScrapeParams = {
      keywords,
      location,
      sites,
      results_per_site: resultsPerSite,
      is_remote: isRemote,
      ...(jobType && { job_type: jobType }),
      hours_old: hoursOld,
      distance,
    };
    const { jobs, errors, error } = await scrapeJobsAction(params);

    setLoading(false);

    if (error) {
      setTopError(error);
      return;
    }

    setResults(jobs ?? []);
    setScrapeErrors(errors ?? []);
  }

  async function handleSave(job: ScrapedJob, index: number) {
    setSavingId(index);
    const { error } = await saveScrapedJobAction(job);
    setSavingId(null);

    if (error) {
      setScrapeErrors((prev) => [...prev, `Save failed: ${error}`]);
      return;
    }

    setSavedIds((prev) => new Set(prev).add(index));
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Import Jobs</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Search job sites and preview results before saving to your tracker.
      </p>

      {/* Form */}
      <div className="border border-border rounded-lg p-6 mb-8 space-y-4 bg-background">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Keywords</label>
            <Input
              placeholder="e.g. software engineer"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="e.g. New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Sites</label>
          <div className="flex gap-3">
            {SITES.map((site) => (
              <label key={site} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sites.includes(site)}
                  onChange={() => toggleSite(site)}
                  className="accent-primary"
                />
                {site.replace("_", " ")}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Results per site</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={resultsPerSite}
              onChange={(e) => setResultsPerSite(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Job type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All types</option>
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Hours old</label>
            <Input
              type="number"
              min={1}
              value={hoursOld}
              onChange={(e) => setHoursOld(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Distance (mi)</label>
            <Input
              type="number"
              min={1}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="accent-primary"
            />
            Remote only
          </label>
          <Button
            onClick={handleScrape}
            disabled={loading || !keywords.trim() || !location.trim() || sites.length === 0}
          >
            {loading ? "Searching…" : "Search Jobs"}
          </Button>
        </div>
      </div>

      {/* Top-level error */}
      {topError && (
        <p className="text-destructive text-sm mb-4">{topError}</p>
      )}

      {/* Per-site errors */}
      {scrapeErrors.length > 0 && (
        <div className="mb-4 space-y-1">
          {scrapeErrors.map((e, i) => (
            <p key={i} className="text-destructive text-xs">{e}</p>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {results.length} job{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Role</th>
                  <th className="text-left px-4 py-2 font-medium">Company</th>
                  <th className="text-left px-4 py-2 font-medium">Source</th>
                  <th className="text-left px-4 py-2 font-medium">Salary</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {results.map((job, i) => {
                  const saved = savedIds.has(i);
                  const saving = savingId === i;
                  return (
                    <tr key={i} className="border-t border-border hover:bg-accent/40">
                      <td className="px-4 py-2">
                        {job.link ? (
                          <a
                            href={job.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {job.role}
                          </a>
                        ) : (
                          job.role
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{job.company}</td>
                      <td className="px-4 py-2 text-muted-foreground capitalize">{job.source}</td>
                      <td className="px-4 py-2 text-muted-foreground">{job.salary ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="sm"
                          variant={saved ? "outline" : "default"}
                          disabled={saved || saving}
                          onClick={() => handleSave(job, i)}
                        >
                          {saving ? "Saving…" : saved ? "Saved" : "Save"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !topError && (
        <p className="text-muted-foreground text-sm text-center py-12">
          Enter keywords and a location to find jobs.
        </p>
      )}
    </div>
  );
}

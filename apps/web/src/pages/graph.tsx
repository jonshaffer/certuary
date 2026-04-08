import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { getAllCerts, getAllProviders } from "@certuary/data";
import type { CertStatus } from "@certuary/data";
import { buildNetworkGraph, findClusters } from "../lib/domain-analysis";
import { computeSimilarityMatrix } from "../lib/similarity-matrix";
import { classicalMds } from "../lib/mds";
import { getProviderColor } from "@/lib/provider-colors";
import { getCertLabel } from "@/lib/cert-label";
import * as d3 from "d3";

function parseMinOverlap(value: string | null): number {
  const defaultMinOverlap = 0.15;
  const parsed = value === null ? defaultMinOverlap : parseFloat(value);
  if (!Number.isFinite(parsed)) return defaultMinOverlap;
  return Math.min(1, Math.max(0, parsed));
}

function useGraphParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const provider = searchParams.get("provider") || "";
  const minOverlap = parseMinOverlap(searchParams.get("overlap"));

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  return { provider, minOverlap, setParam };
}

const NODE_BASE_RADIUS = 5;
const NODE_RADIUS_SCALE = 0.8;
const GRAPH_HEIGHT = 600;
const PADDING = 60;

export function GraphPage() {
  const { provider, minOverlap, setParam } = useGraphParams();
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const [showEdges, setShowEdges] = useState(false);

  const providers = useMemo(() => getAllProviders(), []);

  const certs = useMemo(() => {
    let result = getAllCerts().filter((c) => c.domains.length > 0);
    if (provider) {
      result = result.filter((c) => c.providerSlug === provider);
    }
    return result;
  }, [provider]);

  // Full NxN similarity → distance matrix → MDS 2D coordinates
  const similarity = useMemo(
    () => computeSimilarityMatrix(certs),
    [certs]
  );

  const mdsPoints = useMemo(
    () => classicalMds(similarity.distances),
    [similarity.distances]
  );

  // Cluster detection (reuse existing graph + findClusters)
  const graph = useMemo(
    () => buildNetworkGraph(certs, minOverlap),
    [certs, minOverlap]
  );

  const clusters = useMemo(
    () => findClusters(graph.nodes, graph.edges, certs),
    [graph.nodes, graph.edges, certs]
  );

  // Build a lookup for cert data by index
  interface ScatterNode {
    id: string;
    name: string;
    shortName?: string;
    providerSlug: string;
    domainCount: number;
    status: CertStatus;
    x: number;
    y: number;
  }

  const scatterNodes: ScatterNode[] = useMemo(() => {
    return mdsPoints.map((pt) => {
      const cert = certs[pt.index];
      return {
        id: cert.slug,
        name: cert.name,
        shortName: cert.shortName,
        providerSlug: cert.providerSlug,
        domainCount: cert.domains.length,
        status: cert.status,
        x: pt.x,
        y: pt.y,
      };
    });
  }, [mdsPoints, certs]);

  useEffect(() => {
    if (!svgRef.current || scatterNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = GRAPH_HEIGHT;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 6])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Scales
    const xExtent = d3.extent(scatterNodes, (d) => d.x) as [number, number];
    const yExtent = d3.extent(scatterNodes, (d) => d.y) as [number, number];

    const xScale = d3
      .scaleLinear()
      .domain(xExtent)
      .range([PADDING, width - PADDING]);

    const yScale = d3
      .scaleLinear()
      .domain(yExtent)
      .range([PADDING, height - PADDING]);

    // Build node lookup by slug
    const nodeBySlug = new Map(scatterNodes.map((n) => [n.id, n]));

    // Cluster hulls
    const clusterData = clusters
      .map((c) => {
        const nodes = c.nodeIds
          .map((id) => nodeBySlug.get(id))
          .filter((n): n is ScatterNode => n != null);
        // Find dominant provider for coloring
        const providerCounts = new Map<string, number>();
        for (const n of nodes) {
          providerCounts.set(
            n.providerSlug,
            (providerCounts.get(n.providerSlug) ?? 0) + 1
          );
        }
        let dominantProvider = "";
        let maxCount = 0;
        for (const [slug, count] of providerCounts) {
          if (count > maxCount) {
            maxCount = count;
            dominantProvider = slug;
          }
        }
        return { ...c, nodes, dominantProvider };
      })
      .filter((c) => c.nodes.length >= 3);

    // Draw hulls behind everything
    const hullGroup = g.append("g");

    for (const cluster of clusterData) {
      const points: [number, number][] = cluster.nodes.map((n) => [
        xScale(n.x),
        yScale(n.y),
      ]);

      const hull = d3.polygonHull(points);
      if (!hull) continue;

      // Expand hull outward from centroid for padding
      const cx = d3.mean(hull, (p) => p[0])!;
      const cy = d3.mean(hull, (p) => p[1])!;
      const expanded: [number, number][] = hull.map(([px, py]) => {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist > 0 ? (dist + 20) / dist : 1;
        return [cx + dx * scale, cy + dy * scale];
      });

      hullGroup
        .append("path")
        .attr(
          "d",
          d3.line().curve(d3.curveCatmullRomClosed)(expanded)
        )
        .attr("fill", getProviderColor(cluster.dominantProvider))
        .attr("fill-opacity", 0.06)
        .attr("stroke", getProviderColor(cluster.dominantProvider))
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,3");

      // Cluster label at centroid
      hullGroup
        .append("text")
        .attr("x", cx)
        .attr("y", cy - 15)
        .text(cluster.label)
        .attr("font-size", "13px")
        .attr("font-weight", "600")
        .attr("fill", "currentColor")
        .attr("opacity", 0.35)
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none");
    }

    // Optional edges
    if (showEdges) {
      const edgeGroup = g.append("g");
      for (const edge of graph.edges) {
        const source = nodeBySlug.get(edge.source);
        const target = nodeBySlug.get(edge.target);
        if (!source || !target) continue;

        edgeGroup
          .append("line")
          .attr("x1", xScale(source.x))
          .attr("y1", yScale(source.y))
          .attr("x2", xScale(target.x))
          .attr("y2", yScale(target.y))
          .attr("stroke", "#999")
          .attr("stroke-opacity", 0.1 + edge.weight * 0.4)
          .attr("stroke-width", 0.5 + edge.weight * 2);
      }
    }

    // Nodes
    const node = g
      .append("g")
      .selectAll<SVGCircleElement, ScatterNode>("circle")
      .data(scatterNodes)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => NODE_BASE_RADIUS + d.domainCount * NODE_RADIUS_SCALE)
      .attr("fill", (d) => getProviderColor(d.providerSlug))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) =>
        d.status === "retiring" ? "3,2" : null
      )
      .attr("opacity", (d) => (d.status === "retired" ? 0.4 : 1))
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        navigate(`/cert/${d.id}`);
      });

    // Labels
    g.append("g")
      .selectAll("text")
      .data(scatterNodes)
      .join("text")
      .text((d) => getCertLabel({ shortName: d.shortName, slug: d.id }))
      .attr("x", (d) => xScale(d.x))
      .attr("y", (d) => yScale(d.y))
      .attr("font-size", "10px")
      .attr("dx", 10)
      .attr("dy", 3)
      .attr("fill", "currentColor")
      .attr("pointer-events", "none");

    // Styled tooltip
    const tooltip = d3
      .select(svgRef.current.parentElement!)
      .append("div")
      .attr(
        "class",
        "absolute pointer-events-none z-50 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md opacity-0 transition-opacity"
      )
      .style("position", "absolute");

    node
      .on("mouseover", (event, d) => {
        const statusLabel =
          d.status === "retiring"
            ? " · retiring"
            : d.status === "retired"
              ? " · retired"
              : "";
        tooltip
          .html(
            `<div class="font-medium">${d.name}</div>` +
              `<div class="text-xs text-muted-foreground">${d.providerSlug}${statusLabel} · ${d.domainCount} domains</div>`
          )
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 10}px`)
          .style("opacity", "1");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", "0");
      });

    return () => {
      tooltip.remove();
    };
  }, [scatterNodes, clusters, graph.edges, showEdges, navigate]);

  // Provider legend
  const visibleProviders = useMemo(() => {
    const slugs = new Set(scatterNodes.map((n) => n.providerSlug));
    return providers.filter((p) => slugs.has(p.slug));
  }, [scatterNodes, providers]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Similarity Map</h1>
        <p className="text-sm text-muted-foreground">
          {scatterNodes.length} certs, {clusters.length} clusters
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Provider:</label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={provider}
            onChange={(e) => setParam("provider", e.target.value)}
          >
            <option value="">All providers</option>
            {providers.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Cluster threshold:</label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={String(minOverlap)}
            onChange={(e) => setParam("overlap", e.target.value)}
          >
            <option value="0.05">5% (many clusters)</option>
            <option value="0.1">10%</option>
            <option value="0.15">15% (default)</option>
            <option value="0.2">20%</option>
            <option value="0.3">30% (fewer clusters)</option>
            <option value="0.4">40%</option>
          </select>
        </div>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={showEdges}
            onChange={(e) => setShowEdges(e.target.checked)}
            className="rounded"
          />
          Show edges
        </label>
      </div>

      {/* Scatter plot */}
      <div className="relative rounded border border-border bg-card overflow-hidden">
        {scatterNodes.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            No certifications with domain data found. Try broadening your
            filters.
          </p>
        ) : (
          <svg
            ref={svgRef}
            className="w-full text-foreground"
            style={{ height: GRAPH_HEIGHT }}
          />
        )}
      </div>

      {/* Provider legend */}
      {visibleProviders.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {visibleProviders.map((p) => (
            <div key={p.slug} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getProviderColor(p.slug) }}
              />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Certifications positioned by topic similarity using dimensionality
        reduction (classical MDS on domain keyword overlap). Closer certs share
        more exam content. Dashed hulls outline detected clusters. Node size
        reflects domain count. Dashed outlines indicate retiring certs; dimmed
        nodes are retired. Click a node to view cert details. Scroll to zoom.
      </p>
    </div>
  );
}

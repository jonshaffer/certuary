import { useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { getAllCerts, getAllProviders } from "@certuary/data";
import type { CertStatus } from "@certuary/data";
import { buildNetworkGraph } from "../lib/domain-analysis";
import { getProviderColor } from "@/lib/provider-colors";
import { getCertLabel } from "@/lib/cert-label";
import * as d3 from "d3";

function parseMinOverlap(value: string | null): number {
  const defaultMinOverlap = 0.15;
  const parsed = value === null ? defaultMinOverlap : parseFloat(value);
  if (!Number.isFinite(parsed)) return defaultMinOverlap;
  return Math.min(1, Math.max(0, parsed));
}

function useNetworkParams() {
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

const LINK_DISTANCE_FACTOR = 120;
const CHARGE_STRENGTH = -200;
const COLLISION_RADIUS = 25;
const NODE_BASE_RADIUS = 5;
const NODE_RADIUS_SCALE = 0.8;
const GRAPH_HEIGHT = 600;

export function NetworkPage() {
  const { provider, minOverlap, setParam } = useNetworkParams();
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();

  const providers = useMemo(() => getAllProviders(), []);

  const certs = useMemo(() => {
    let result = getAllCerts().filter((c) => c.domains.length > 0);
    if (provider) {
      result = result.filter((c) => c.providerSlug === provider);
    }
    return result;
  }, [provider]);

  const graph = useMemo(
    () => buildNetworkGraph(certs, minOverlap),
    [certs, minOverlap]
  );

  // Only show nodes that have at least one edge
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of graph.edges) {
      ids.add(edge.source);
      ids.add(edge.target);
    }
    return ids;
  }, [graph.edges]);

  const filteredNodes = useMemo(
    () => graph.nodes.filter((n) => connectedNodeIds.has(n.id)),
    [graph.nodes, connectedNodeIds]
  );

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = GRAPH_HEIGHT;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    type SimNode = d3.SimulationNodeDatum & {
      id: string;
      name: string;
      shortName?: string;
      providerSlug: string;
      domainCount: number;
      status: CertStatus;
    };

    type SimEdge = d3.SimulationLinkDatum<SimNode> & {
      weight: number;
    };

    const simNodes: SimNode[] = filteredNodes.map((n) => ({ ...n }));
    const simEdges: SimEdge[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          .distance((d) => LINK_DISTANCE_FACTOR * (1 - d.weight))
          .strength((d) => d.weight)
      )
      .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(COLLISION_RADIUS));

    const link = g
      .append("g")
      .selectAll("line")
      .data(simEdges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", (d) => 0.1 + d.weight * 0.6)
      .attr("stroke-width", (d) => 1 + d.weight * 3);

    const node = g
      .append("g")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", (d) => NODE_BASE_RADIUS + d.domainCount * NODE_RADIUS_SCALE)
      .attr("fill", (d) => getProviderColor(d.providerSlug))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => d.status === "retiring" ? "3,2" : null)
      .attr("opacity", (d) => d.status === "retired" ? 0.4 : 1)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        navigate(`/cert/${d.id}`);
      })
      .call(
        d3
          .drag<SVGCircleElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const label = g
      .append("g")
      .selectAll("text")
      .data(simNodes)
      .join("text")
      .text((d) => getCertLabel({ shortName: d.shortName, slug: d.id }))
      .attr("font-size", "11px")
      .attr("dx", 10)
      .attr("dy", 3)
      .attr("fill", "currentColor")
      .attr("pointer-events", "none");

    // Styled HTML tooltip
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

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      label.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [filteredNodes, graph.edges, connectedNodeIds, navigate]);

  // Build provider legend from visible nodes
  const visibleProviders = useMemo(() => {
    const slugs = new Set(filteredNodes.map((n) => n.providerSlug));
    return providers.filter((p) => slugs.has(p.slug));
  }, [filteredNodes, providers]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Certification Network</h1>
        <p className="text-sm text-muted-foreground">
          {filteredNodes.length} certs, {graph.edges.length} connections
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
          <label className="text-sm font-medium">Min overlap:</label>
          <select
            className="rounded border border-border bg-background px-2 py-1 text-sm"
            value={String(minOverlap)}
            onChange={(e) => setParam("overlap", e.target.value)}
          >
            <option value="0.05">5% (many connections)</option>
            <option value="0.1">10%</option>
            <option value="0.15">15% (default)</option>
            <option value="0.2">20%</option>
            <option value="0.3">30% (fewer connections)</option>
            <option value="0.4">40%</option>
          </select>
        </div>
      </div>

      {/* Graph */}
      <div className="relative rounded border border-border bg-card overflow-hidden">
        {filteredNodes.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            No connections found at this overlap threshold. Try lowering the
            minimum overlap.
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
        Nodes are certifications colored by provider. Edges connect certs with
        overlapping exam domains. Node size reflects domain count. Dashed
        outlines indicate retiring certs; dimmed nodes are retired. Drag nodes
        to rearrange. Click a node to view cert details. Scroll to zoom.
      </p>
    </div>
  );
}

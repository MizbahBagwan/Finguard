(() => {
    "use strict";

    /*
     * ============================================================
     * FinGuard AI - Knowledge Graph
     * ============================================================
     * Only controls the Knowledge Graph.
     * Does NOT modify the dashboard's global theme.
     * ============================================================
     */

    const API_URL = "/dashboard/knowledge-graph";

    let d3ReadyPromise = null;
    let svg = null;
    let graphRoot = null;
    let simulation = null;
    let zoomBehavior = null;

    let currentData = {
        nodes: [],
        relationships: []
    };

    let currentNodes = [];
    let currentLinks = [];

    let currentSearch = "";
    let currentType = "all";

    let width = 1000;
    let height = 650;

    /*
     * ------------------------------------------------------------
     * DOM HELPERS
     * ------------------------------------------------------------
     */

    function findElement(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function getGraphContainer() {
        return findElement([
            "#knowledgeGraph",
            "#knowledge-graph",
            "#knowledgeGraphContainer",
            "#knowledge-graph-container",
            "#graphContainer",
            "#graph-container",
            ".knowledge-graph",
            ".knowledge-graph-container",
            ".graph-container",
            "[data-knowledge-graph]"
        ]);
    }

    function getSearchInput() {
        return findElement([
            "#graphSearch",
            "#knowledgeGraphSearch",
            "#knowledge-graph-search",
            "#nodeSearch",
            "input[placeholder*='Search transaction']",
            "input[placeholder*='Search Transaction']",
            "input[placeholder*='Search node']",
            "input[placeholder*='search transaction']"
        ]);
    }

    function getTypeSelect() {
        return findElement([
            "#graphNodeType",
            "#nodeType",
            "#knowledgeGraphType",
            "#knowledge-graph-type",
            "select"
        ]);
    }

    function getRefreshButton() {
        return findElement([
            "#refreshGraph",
            "#refreshNetwork",
            "#refresh-graph",
            "#refresh-network",
            "button[data-action='refresh-graph']"
        ]);
    }

    function getResetButton() {
        return findElement([
            "#resetGraph",
            "#resetView",
            "#reset-view",
            "button[data-action='reset-graph']"
        ]);
    }

    /*
     * ------------------------------------------------------------
     * REMOVE OLD LOADING / INITIALIZING UI
     * ------------------------------------------------------------
     */

    function removeInitializingOverlay() {
        const selectors = [
            "#graphLoader",
            "#knowledgeGraphLoader",
            "#knowledge-graph-loader",
            ".graph-loader",
            ".knowledge-graph-loader",
            ".graph-loading",
            ".knowledge-graph-loading",
            ".initializing-ai-network",
            "[data-graph-loader]"
        ];

        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => {
                element.remove();
            });
        });

        /*
         * Hide only elements whose visible text specifically contains
         * "Initializing AI Network" or "Loading relationship intelligence".
         *
         * We intentionally do NOT modify the rest of the dashboard.
         */

        document.querySelectorAll("body *").forEach((element) => {
            if (!element.children.length) {
                const text = (element.textContent || "").trim().toLowerCase();

                if (
                    text.includes("initializing ai network") ||
                    text.includes("loading relationship intelligence")
                ) {
                    const parent = element.parentElement;

                    if (
                        parent &&
                        parent !== document.body &&
                        (
                            parent.children.length <= 3 ||
                            parent.classList.contains("loader") ||
                            parent.classList.contains("loading") ||
                            parent.classList.contains("overlay")
                        )
                    ) {
                        parent.style.display = "none";
                    } else {
                        element.style.display = "none";
                    }
                }
            }
        });
    }

    /*
     * ------------------------------------------------------------
     * LOAD D3
     * ------------------------------------------------------------
     */

    function loadD3() {
        if (window.d3) {
            return Promise.resolve(window.d3);
        }

        if (d3ReadyPromise) {
            return d3ReadyPromise;
        }

        d3ReadyPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(
                "script[src*='d3.min.js'], script[src*='d3.v']"
            );

            if (existing) {
                existing.addEventListener("load", () => {
                    if (window.d3) {
                        resolve(window.d3);
                    } else {
                        reject(new Error("D3 loaded but window.d3 is unavailable."));
                    }
                });

                existing.addEventListener("error", () => {
                    reject(new Error("Unable to load D3."));
                });

                return;
            }

            const script = document.createElement("script");

            script.src = "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js";
            script.async = true;

            script.onload = () => {
                if (window.d3) {
                    resolve(window.d3);
                } else {
                    reject(new Error("D3 loaded but window.d3 is unavailable."));
                }
            };

            script.onerror = () => {
                reject(new Error("Unable to load D3 from CDN."));
            };

            document.head.appendChild(script);
        });

        return d3ReadyPromise;
    }

    /*
     * ------------------------------------------------------------
     * NORMALIZE NODE TYPE
     * ------------------------------------------------------------
     */

    function normalizeType(type) {
        if (!type) {
            return "Unknown";
        }

        const value = String(type)
            .trim()
            .replace(/_/g, " ")
            .replace(/\s+/g, " ");

        const lower = value.toLowerCase();

        if (lower.includes("transaction")) {
            return "Transaction";
        }

        if (lower.includes("account")) {
            return "Account";
        }

        if (lower.includes("merchant")) {
            return "Merchant";
        }

        if (lower.includes("device")) {
            return "Device";
        }

        if (lower.includes("card")) {
            return "Card";
        }

        if (
            lower.includes("fraud") ||
            lower.includes("alert")
        ) {
            return "Fraud Alert";
        }

        if (lower.includes("user")) {
            return "User";
        }

        if (
            lower.includes("location") ||
            lower.includes("ipaddress") ||
            lower.includes("ip address")
        ) {
            return "Location";
        }

        return value;
    }

    /*
     * ------------------------------------------------------------
     * NODE COLORS
     * ------------------------------------------------------------
     */

    function getNodeColor(type) {
        const normalized = normalizeType(type);

        const colors = {
            "Transaction": "#22d3ee",
            "Account": "#818cf8",
            "Merchant": "#a78bfa",
            "Device": "#22c55e",
            "Card": "#f59e0b",
            "Fraud Alert": "#ef4444",
            "User": "#38bdf8",
            "Location": "#22d3ee",
            "Unknown": "#64748b"
        };

        return colors[normalized] || colors.Unknown;
    }

    /*
     * ------------------------------------------------------------
     * LABEL
     * ------------------------------------------------------------
     */

    function getNodeLabel(node) {
        if (!node) {
            return "Unknown";
        }

        const properties = node.properties || {};

        const candidates = [
            node.label,
            properties.name,
            properties.transaction_id,
            properties.account_id,
            properties.merchant_name,
            properties.card_id,
            properties.device_id,
            properties.user_id,
            properties.id
        ];

        for (const value of candidates) {
            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return String(value);
            }
        }

        return String(node.id || "Unknown");
    }

    /*
     * ------------------------------------------------------------
     * SHORT LABEL
     * ------------------------------------------------------------
     */

    function shortLabel(value, maxLength = 24) {
        const text = String(value || "");

        if (text.length <= maxLength) {
            return text;
        }

        return `${text.substring(0, maxLength - 1)}…`;
    }

    /*
     * ------------------------------------------------------------
     * FETCH GRAPH
     * ------------------------------------------------------------
     */

    async function fetchGraph() {
        console.log("KNOWLEDGE GRAPH: Connecting to Neo4j...");

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(
                    `Knowledge Graph API failed: ${response.status}`
                );
            }

            const data = await response.json();

            if (!data || typeof data !== "object") {
                throw new Error("Invalid Knowledge Graph response.");
            }

            const nodes = Array.isArray(data.nodes)
                ? data.nodes
                : [];

            const relationships = Array.isArray(data.relationships)
                ? data.relationships
                : [];

            currentData = {
                nodes,
                relationships
            };

            console.log(
                `KNOWLEDGE GRAPH: ${nodes.length} nodes, ${relationships.length} relationships`
            );

            return currentData;
        } catch (error) {
            console.error(
                "KNOWLEDGE GRAPH ERROR:",
                error
            );

            showGraphMessage(
                "Unable to load Knowledge Graph",
                error.message || "Neo4j connection failed."
            );

            return {
                nodes: [],
                relationships: []
            };
        }
    }

    /*
     * ------------------------------------------------------------
     * PREPARE GRAPH DATA
     * ------------------------------------------------------------
     */

    function prepareData(data) {
        const nodes = Array.isArray(data.nodes)
            ? data.nodes
                .filter(Boolean)
                .map((node, index) => {
                    const id = String(
                        node.id ??
                        node.elementId ??
                        `node-${index}`
                    );

                    return {
                        ...node,
                        id,
                        graphType: normalizeType(node.type),
                        graphLabel: getNodeLabel(node),
                        properties: node.properties || {}
                    };
                })
            : [];

        const nodeIds = new Set(
            nodes.map((node) => String(node.id))
        );

        const links = Array.isArray(data.relationships)
            ? data.relationships
                .filter((relationship) => {
                    if (!relationship) {
                        return false;
                    }

                    if (
                        relationship.source === null ||
                        relationship.target === null ||
                        relationship.source === undefined ||
                        relationship.target === undefined
                    ) {
                        return false;
                    }

                    return (
                        nodeIds.has(String(relationship.source)) &&
                        nodeIds.has(String(relationship.target))
                    );
                })
                .map((relationship) => ({
                    source: String(relationship.source),
                    target: String(relationship.target),
                    type: String(
                        relationship.type ||
                        "RELATED"
                    )
                }))
            : [];

        return {
            nodes,
            links
        };
    }

    /*
     * ------------------------------------------------------------
     * FILTER DATA
     * ------------------------------------------------------------
     */

    function getFilteredData() {
        const search = currentSearch.trim().toLowerCase();
        const type = currentType.toLowerCase();

        let nodes = currentData.nodes
            .map((node, index) => ({
                ...node,
                id: String(
                    node.id ??
                    node.elementId ??
                    `node-${index}`
                ),
                graphType: normalizeType(node.type),
                graphLabel: getNodeLabel(node)
            }));

        if (type !== "all") {
            nodes = nodes.filter((node) => {
                return normalizeType(node.type).toLowerCase() === type;
            });
        }

        if (search) {
            nodes = nodes.filter((node) => {
                const searchable = [
                    node.graphLabel,
                    node.id,
                    node.graphType,
                    JSON.stringify(node.properties || {})
                ]
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(search);
            });
        }

        const allowedIds = new Set(
            nodes.map((node) => String(node.id))
        );

        const links = currentData.relationships
            .filter((link) => {
                if (!link) {
                    return false;
                }

                const source = String(link.source);
                const target = String(link.target);

                return (
                    allowedIds.has(source) &&
                    allowedIds.has(target)
                );
            })
            .map((link) => ({
                source: String(link.source),
                target: String(link.target),
                type: String(link.type || "RELATED")
            }));

        return {
            nodes,
            links
        };
    }

    /*
     * ------------------------------------------------------------
     * GRAPH SIZE
     * ------------------------------------------------------------
     */

    function calculateGraphSize(container) {
        const rect = container.getBoundingClientRect();

        width = Math.max(
            700,
            Math.floor(rect.width || 1000)
        );

        /*
         * Large height gives the graph the same spacious feeling
         * as the first screenshot.
         */

        const calculatedHeight = Math.max(
            600,
            Math.floor(
                Math.min(
                    Math.max(window.innerHeight * 0.72, 600),
                    850
                )
            )
        );

        height = calculatedHeight;
    }

    /*
     * ------------------------------------------------------------
     * CREATE SVG
     * ------------------------------------------------------------
     */

    function createSVG(container) {
        const d3 = window.d3;

        calculateGraphSize(container);

        /*
         * Remove only the old graph SVG.
         */

        container
            .querySelectorAll("svg.finguard-knowledge-graph")
            .forEach((element) => element.remove());

        const svgElement = d3
            .select(container)
            .append("svg")
            .attr("class", "finguard-knowledge-graph")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("display", "block")
            .style("width", "100%")
            .style("height", `${height}px`)
            .style("cursor", "grab")
            .style("overflow", "hidden");

        svg = svgElement;

        /*
         * Definitions
         */

        const defs = svg.append("defs");

        /*
         * Background grid
         */

        const pattern = defs
            .append("pattern")
            .attr("id", "fg-grid-pattern")
            .attr("width", 40)
            .attr("height", 40)
            .attr("patternUnits", "userSpaceOnUse");

        pattern
            .append("path")
            .attr("d", "M 40 0 L 0 0 0 40")
            .attr("fill", "none")
            .attr("stroke", "#172033")
            .attr("stroke-width", 0.7)
            .attr("opacity", 0.45);

        /*
         * Arrow
         */

        defs
            .append("marker")
            .attr("id", "fg-arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 13)
            .attr("refY", 0)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#64748b")
            .attr("opacity", 0.85);

        /*
         * Glow filters
         */

        const glow = defs
            .append("filter")
            .attr("id", "fg-node-glow")
            .attr("x", "-100%")
            .attr("y", "-100%")
            .attr("width", "300%")
            .attr("height", "300%");

        glow
            .append("feGaussianBlur")
            .attr("stdDeviation", 5)
            .attr("result", "blur");

        const merge = glow
            .append("feMerge");

        merge.append("feMergeNode")
            .attr("in", "blur");

        merge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        /*
         * Background
         */

        svg
            .append("rect")
            .attr("class", "fg-graph-background")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#030916");

        svg
            .append("rect")
            .attr("class", "fg-graph-grid")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "url(#fg-grid-pattern)")
            .attr("opacity", 0.65);

        /*
         * Main zoom group
         */

        graphRoot = svg
            .append("g")
            .attr("class", "fg-graph-root");

        /*
         * Zoom
         */

        zoomBehavior = d3
            .zoom()
            .scaleExtent([0.25, 4])
            .on("start", () => {
                svg.style("cursor", "grabbing");
            })
            .on("zoom", (event) => {
                graphRoot.attr(
                    "transform",
                    event.transform
                );
            })
            .on("end", () => {
                svg.style("cursor", "grab");
            });

        svg.call(zoomBehavior);

        /*
         * Initial zoom.
         */

        svg.call(
            zoomBehavior.transform,
            d3.zoomIdentity
        );

        /*
         * Prevent browser selection while dragging.
         */

        svg.on("dblclick.zoom", null);

        return svg;
    }

    /*
     * ------------------------------------------------------------
     * CREATE GRAPH CONTROLS
     * ------------------------------------------------------------
     */

    function createGraphControls(container) {
        const oldControls = container.querySelector(
            ".fg-graph-controls"
        );

        if (oldControls) {
            oldControls.remove();
        }

        const controls = document.createElement("div");

        controls.className = "fg-graph-controls";

        controls.innerHTML = `
            <button type="button"
                    class="fg-graph-control-btn"
                    data-fg-action="zoom-in"
                    title="Zoom in">+</button>

            <button type="button"
                    class="fg-graph-control-btn"
                    data-fg-action="zoom-out"
                    title="Zoom out">−</button>

            <button type="button"
                    class="fg-graph-control-btn fg-reset-btn"
                    data-fg-action="reset"
                    title="Reset graph">Reset</button>
        `;

        container.appendChild(controls);

        /*
         * Minimal local styling.
         * Does not change dashboard theme.
         */

        if (!document.getElementById("fg-graph-local-style")) {
            const style = document.createElement("style");

            style.id = "fg-graph-local-style";

            style.textContent = `
                .fg-graph-controls {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    z-index: 30;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    pointer-events: auto;
                }

                .fg-graph-control-btn {
                    min-width: 38px;
                    height: 36px;
                    padding: 0 12px;
                    border: 1px solid #263550;
                    border-radius: 8px;
                    background: #0d1729;
                    color: #e7edf7;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(0,0,0,.25);
                    transition:
                        background .15s ease,
                        border-color .15s ease,
                        transform .15s ease;
                }

                .fg-graph-control-btn:hover {
                    background: #14223a;
                    border-color: #3b82f6;
                    transform: translateY(-1px);
                }

                .fg-reset-btn {
                    min-width: 54px;
                    font-size: 13px;
                }

                .fg-graph-host {
                    position: relative;
                    overflow: hidden;
                }

                .fg-graph-node-label {
                    pointer-events: none;
                    user-select: none;
                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .fg-graph-link-label {
                    pointer-events: none;
                    user-select: none;
                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .fg-node {
                    cursor: pointer;
                }

                .fg-node:hover circle {
                    stroke-width: 3px;
                }
            `;

            document.head.appendChild(style);
        }

        /*
         * Ensure container is positioned.
         */

        const computed = window.getComputedStyle(container);

        if (computed.position === "static") {
            container.style.position = "relative";
        }

        controls
            .querySelectorAll("[data-fg-action]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    const action = button.dataset.fgAction;

                    if (!svg || !zoomBehavior) {
                        return;
                    }

                    if (action === "zoom-in") {
                        svg
                            .transition()
                            .duration(250)
                            .call(
                                zoomBehavior.scaleBy,
                                1.3
                            );
                    }

                    if (action === "zoom-out") {
                        svg
                            .transition()
                            .duration(250)
                            .call(
                                zoomBehavior.scaleBy,
                                0.77
                            );
                    }

                    if (action === "reset") {
                        resetGraphView();
                    }
                });
            });
    }

    /*
     * ------------------------------------------------------------
     * RESET VIEW
     * ------------------------------------------------------------
     */

    function resetGraphView() {
        if (!svg || !zoomBehavior) {
            return;
        }

        svg
            .transition()
            .duration(500)
            .call(
                zoomBehavior.transform,
                window.d3.zoomIdentity
            );

        if (simulation) {
            simulation.alpha(0.5).restart();
        }
    }

    /*
     * ------------------------------------------------------------
     * RENDER GRAPH
     * ------------------------------------------------------------
     */

    function renderGraph(container) {
        const d3 = window.d3;

        if (!d3) {
            throw new Error("D3 is not available.");
        }

        const filtered = getFilteredData();

        currentNodes = filtered.nodes;
        currentLinks = filtered.links;

        createSVG(container);
        createGraphControls(container);

        if (!currentNodes.length) {
            showGraphMessage(
                "No graph data found",
                "Try another search or node type."
            );

            return;
        }

        const linkLayer = graphRoot
            .append("g")
            .attr("class", "fg-links");

        const linkLabelLayer = graphRoot
            .append("g")
            .attr("class", "fg-link-labels");

        const nodeLayer = graphRoot
            .append("g")
            .attr("class", "fg-nodes");

        /*
         * --------------------------------------------------------
         * LINKS
         * --------------------------------------------------------
         */

        const link = linkLayer
            .selectAll("line")
            .data(
                currentLinks,
                (d) =>
                    `${d.source}->${d.target}:${d.type}`
            )
            .join("line")
            .attr("class", "fg-link")
            .attr("stroke", "#33445f")
            .attr("stroke-width", 1.25)
            .attr("stroke-opacity", 0.72)
            .attr(
                "marker-end",
                "url(#fg-arrow)"
            );

        /*
         * --------------------------------------------------------
         * LINK LABELS
         * --------------------------------------------------------
         */

        const linkLabel = linkLabelLayer
            .selectAll("text")
            .data(
                currentLinks,
                (d) =>
                    `${d.source}->${d.target}:${d.type}`
            )
            .join("text")
            .attr("class", "fg-graph-link-label")
            .attr("fill", "#7d8ca5")
            .attr("font-size", 9)
            .attr("font-weight", 500)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("paint-order", "stroke")
            .style("stroke", "#030916")
            .style("stroke-width", "4px")
            .style("stroke-linejoin", "round")
            .text((d) => {
                return shortLabel(
                    String(d.type || "RELATED")
                        .replace(/_/g, " "),
                    18
                ).toUpperCase();
            });

        /*
         * --------------------------------------------------------
         * NODES
         * --------------------------------------------------------
         */

        const node = nodeLayer
            .selectAll("g.fg-node")
            .data(
                currentNodes,
                (d) => d.id
            )
            .join("g")
            .attr("class", "fg-node")
            .call(
                d3.drag()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded)
            );

        /*
         * Outer glow.
         */

        node
            .append("circle")
            .attr("class", "fg-node-glow")
            .attr("r", (d) => {
                return d.graphType === "Fraud Alert"
                    ? 17
                    : 14;
            })
            .attr("fill", (d) => getNodeColor(d.graphType))
            .attr("opacity", 0.20)
            .attr("filter", "url(#fg-node-glow)");

       /*
 * Main node - slightly larger
 */

        node
        .append("circle")
        .attr("class", "fg-node-circle")
        .attr("r", (d) => {
            if (d.graphType === "Transaction") {
            return 13;
            }

            if (d.graphType === "Fraud Alert") {
            return 13;
            }

            return 11;
        })
            .attr("fill", (d) => getNodeColor(d.graphType))
            .attr("stroke", "#dce8ff")
            .attr("stroke-width", 1.2)
            .attr("stroke-opacity", 0.9)
            .attr("filter", "url(#fg-node-glow)");

        /*
         * Node label.
         */

        node
            .append("text")
            .attr("class", "fg-graph-node-label")
            .attr("x", 13)
            .attr("y", 4)
            .attr("fill", "#e5edf9")
            .attr("font-size", 10.5)
            .attr("font-weight", 500)
            .style("paint-order", "stroke")
            .style("stroke", "#030916")
            .style("stroke-width", "4px")
            .style("stroke-linejoin", "round")
            .text((d) => shortLabel(d.graphLabel, 28));

        /*
         * Node type under label.
         */

        node
            .append("text")
            .attr("class", "fg-node-type")
            .attr("x", 13)
            .attr("y", 17)
            .attr("fill", "#64748b")
            .attr("font-size", 8.5)
            .style("paint-order", "stroke")
            .style("stroke", "#030916")
            .style("stroke-width", "3px")
            .text((d) => d.graphType);

        /*
         * Tooltip.
         */

        node
            .append("title")
            .text((d) => {
                const properties = d.properties || {};

                const propertyText = Object.entries(
                    properties
                )
                    .slice(0, 8)
                    .map(([key, value]) => {
                        return `${key}: ${value}`;
                    })
                    .join("\n");

                return [
                    d.graphLabel,
                    `Type: ${d.graphType}`,
                    propertyText
                ]
                    .filter(Boolean)
                    .join("\n");
            });

        /*
         * Node click.
         */

        node.on("click", (event, selectedNode) => {
            event.stopPropagation();

            highlightNode(
                selectedNode,
                node,
                link,
                linkLabel
            );
        });

        /*
         * Click empty graph = clear selection.
         */

        svg.on("click", () => {
            clearHighlight(
                node,
                link,
                linkLabel
            );
        });

        /*
         * --------------------------------------------------------
         * FORCE SIMULATION
         * --------------------------------------------------------
         *
         * This is the important part that makes the graph flexible
         * and prevents the nodes from staying in one small cluster.
         */

        simulation = d3
            .forceSimulation(currentNodes)

            /*
             * Relationship distance.
             */

            .force(
                "link",
                d3
                    .forceLink(currentLinks)
                    .id((d) => d.id)
                    .distance((d) => {
                        const sourceType =
                            d.source?.graphType;

                        const targetType =
                            d.target?.graphType;

                        if (
                            sourceType === "Transaction" ||
                            targetType === "Transaction"
                        ) {
                            return 155;
                        }

                        return 135;
                    })
                    .strength(0.45)
            )

            /*
             * Main repulsion.
             */

            .force(
                "charge",
                d3
                    .forceManyBody()
                    .strength(-520)
                    .distanceMin(40)
                    .distanceMax(900)
            )

            /*
             * Center.
             */

            .force(
                "center",
                d3.forceCenter(
                    width / 2,
                    height / 2
                )
            )

            /*
             * Horizontal spreading.
             */

            .force(
                "x",
                d3
                    .forceX(width / 2)
                    .strength(0.045)
            )

            /*
             * Vertical spreading.
             */

            .force(
                "y",
                d3
                    .forceY(height / 2)
                    .strength(0.045)
            )

            /*
             * Collision.
             */

            .force(
               "collision",
            d3
            .forceCollide()
            .radius((d) => {
              return d.graphType === "Fraud Alert"
                ? 48
                : 42;
            })
            .strength(0.95)
            )

            .alpha(1)
            .alphaDecay(0.025)
            .velocityDecay(0.38)

            .on("tick", () => {
                updatePositions(
                    link,
                    linkLabel,
                    node
                );
            });

        /*
         * Give simulation a little time to settle.
         */

        simulation
            .alpha(1)
            .restart();

        /*
         * Initial position spreading.
         */

        spreadInitialPositions(
            currentNodes
        );
    }

    /*
     * ------------------------------------------------------------
     * INITIAL NODE POSITIONS
     * ------------------------------------------------------------
     */

    function spreadInitialPositions(nodes) {
        const d3 = window.d3;

        const centerX = width / 2;
        const centerY = height / 2;

        const radius = Math.min(
            width,
            height
        ) * 0.27;

        nodes.forEach((node, index) => {
            const angle =
                (index / Math.max(nodes.length, 1)) *
                Math.PI *
                2;

            const ring =
                0.65 +
                (index % 4) * 0.15;

            node.x =
                centerX +
                Math.cos(angle) *
                radius *
                ring;

            node.y =
                centerY +
                Math.sin(angle) *
                radius *
                ring;
        });

        if (simulation) {
            simulation.alpha(0.9).restart();
        }
    }

    /*
     * ------------------------------------------------------------
     * UPDATE POSITIONS
     * ------------------------------------------------------------
     */

    function updatePositions(
        link,
        linkLabel,
        node
    ) {
        link
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        linkLabel
            .attr(
                "x",
                (d) =>
                    (d.source.x + d.target.x) / 2
            )
            .attr(
                "y",
                (d) =>
                    (d.source.y + d.target.y) / 2 - 4
            );

        node.attr(
            "transform",
            (d) =>
                `translate(${d.x},${d.y})`
        );
    }

    /*
     * ------------------------------------------------------------
     * DRAG
     * ------------------------------------------------------------
     */

    function dragStarted(event, d) {
        if (!event.active && simulation) {
            simulation.alphaTarget(0.25).restart();
        }

        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active && simulation) {
            simulation.alphaTarget(0);
        }

        /*
         * Release the node so it remains flexible.
         */

        d.fx = null;
        d.fy = null;
    }

    /*
     * ------------------------------------------------------------
     * HIGHLIGHT NODE
     * ------------------------------------------------------------
     */

    function highlightNode(
        selectedNode,
        node,
        link,
        linkLabel
    ) {
        const selectedId = String(
            selectedNode.id
        );

        const connectedIds = new Set([
            selectedId
        ]);

        currentLinks.forEach((relationship) => {
            const sourceId = String(
                relationship.source.id ??
                relationship.source
            );

            const targetId = String(
                relationship.target.id ??
                relationship.target
            );

            if (sourceId === selectedId) {
                connectedIds.add(targetId);
            }

            if (targetId === selectedId) {
                connectedIds.add(sourceId);
            }
        });

        node
            .transition()
            .duration(180)
            .style(
                "opacity",
                (d) =>
                    connectedIds.has(String(d.id))
                        ? 1
                        : 0.16
            );

        link
            .transition()
            .duration(180)
            .attr(
                "stroke",
                (d) => {
                    const sourceId = String(
                        d.source.id ??
                        d.source
                    );

                    const targetId = String(
                        d.target.id ??
                        d.target
                    );

                    return (
                        sourceId === selectedId ||
                        targetId === selectedId
                    )
                        ? "#38bdf8"
                        : "#33445f";
                }
            )
            .attr(
                "stroke-width",
                (d) => {
                    const sourceId = String(
                        d.source.id ??
                        d.source
                    );

                    const targetId = String(
                        d.target.id ??
                        d.target
                    );

                    return (
                        sourceId === selectedId ||
                        targetId === selectedId
                    )
                        ? 2.4
                        : 1;
                }
            )
            .attr(
                "stroke-opacity",
                (d) => {
                    const sourceId = String(
                        d.source.id ??
                        d.source
                    );

                    const targetId = String(
                        d.target.id ??
                        d.target
                    );

                    return (
                        sourceId === selectedId ||
                        targetId === selectedId
                    )
                        ? 1
                        : 0.18;
                }
            );

        linkLabel
            .transition()
            .duration(180)
            .style(
                "opacity",
                (d) => {
                    const sourceId = String(
                        d.source.id ??
                        d.source
                    );

                    const targetId = String(
                        d.target.id ??
                        d.target
                    );

                    return (
                        sourceId === selectedId ||
                        targetId === selectedId
                    )
                        ? 1
                        : 0.1;
                }
            );
    }

    /*
     * ------------------------------------------------------------
     * CLEAR HIGHLIGHT
     * ------------------------------------------------------------
     */

    function clearHighlight(
        node,
        link,
        linkLabel
    ) {
        node
            .transition()
            .duration(180)
            .style("opacity", 1);

        link
            .transition()
            .duration(180)
            .attr("stroke", "#33445f")
            .attr("stroke-width", 1.25)
            .attr("stroke-opacity", 0.72);

        linkLabel
            .transition()
            .duration(180)
            .style("opacity", 1);
    }

    /*
     * ------------------------------------------------------------
     * MESSAGE
     * ------------------------------------------------------------
     */

    function showGraphMessage(
        title,
        message
    ) {
        const container = getGraphContainer();

        if (!container) {
            return;
        }

        container
            .querySelectorAll(
                ".fg-graph-message"
            )
            .forEach((element) => {
                element.remove();
            });

        const box = document.createElement("div");

        box.className = "fg-graph-message";

        box.innerHTML = `
            <div style="
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                height:100%;
                min-height:500px;
                text-align:center;
                padding:40px;
                box-sizing:border-box;
            ">
                <div style="
                    width:12px;
                    height:12px;
                    border-radius:50%;
                    background:#22d3ee;
                    box-shadow:0 0 18px rgba(34,211,238,.65);
                    margin-bottom:18px;
                "></div>

                <div style="
                    color:#eef4ff;
                    font-size:18px;
                    font-weight:700;
                    margin-bottom:8px;
                ">
                    ${escapeHTML(title)}
                </div>

                <div style="
                    color:#8492a8;
                    font-size:13px;
                    max-width:520px;
                    line-height:1.6;
                ">
                    ${escapeHTML(message)}
                </div>
            </div>
        `;

        container.appendChild(box);
    }

    /*
     * ------------------------------------------------------------
     * ESCAPE HTML
     * ------------------------------------------------------------
     */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /*
     * ------------------------------------------------------------
     * SEARCH EVENTS
     * ------------------------------------------------------------
     */

    function setupSearch() {
        const searchInput = getSearchInput();

        if (!searchInput) {
            return;
        }

        searchInput.addEventListener(
            "input",
            () => {
                currentSearch =
                    searchInput.value || "";

                refreshGraphView();
            }
        );
    }

    /*
     * ------------------------------------------------------------
     * TYPE FILTER
     * ------------------------------------------------------------
     */

    function setupTypeFilter() {
        const select = getTypeSelect();

        if (!select) {
            return;
        }

        select.addEventListener(
            "change",
            () => {
                currentType =
                    select.value || "all";

                refreshGraphView();
            }
        );
    }

    /*
     * ------------------------------------------------------------
     * REFRESH BUTTON
     * ------------------------------------------------------------
     */

    function setupRefreshButton() {
        const button = getRefreshButton();

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async (event) => {
                event.preventDefault();

                button.disabled = true;

                try {
                    await loadAndRender();
                } finally {
                    button.disabled = false;
                }
            }
        );
    }

    /*
     * ------------------------------------------------------------
     * RESET BUTTON
     * ------------------------------------------------------------
     */

    function setupResetButton() {
        const button = getResetButton();

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            (event) => {
                event.preventDefault();

                currentSearch = "";
                currentType = "all";

                const search = getSearchInput();

                if (search) {
                    search.value = "";
                }

                const type = getTypeSelect();

                if (type) {
                    type.value = "all";
                }

                renderGraph(
                    getGraphContainer()
                );
            }
        );
    }

    /*
     * ------------------------------------------------------------
     * RENDER FILTERED GRAPH
     * ------------------------------------------------------------
     */

    function refreshGraphView() {
        const container = getGraphContainer();

        if (!container) {
            console.warn(
                "Knowledge Graph container not found."
            );

            return;
        }

        renderGraph(container);
    }

    /*
     * ------------------------------------------------------------
     * LEGEND
     * ------------------------------------------------------------
     */

    function createLegend(container) {
        /*
         * Do not create a second legend if HTML already has one.
         */

        if (
            container.querySelector(
                ".fg-graph-legend"
            )
        ) {
            return;
        }

        const legend = document.createElement("div");

        legend.className =
            "fg-graph-legend";

        const items = [
            ["Transaction", "#22d3ee"],
            ["Account", "#818cf8"],
            ["Merchant", "#a78bfa"],
            ["Device", "#22c55e"],
            ["Card", "#f59e0b"],
            ["Fraud Alert", "#ef4444"],
            ["User", "#38bdf8"]
        ];

        legend.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                gap:18px;
                flex-wrap:wrap;
                padding:12px 18px;
                background:rgba(3,9,22,.88);
                border-top:1px solid rgba(39,57,84,.75);
                color:#8290a6;
                font-size:11px;
                letter-spacing:.02em;
            ">
                <span style="
                    color:#6f7f98;
                    font-size:10px;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.12em;
                    margin-right:4px;
                ">
                    Entity Types
                </span>

                ${items.map(([name, color]) => `
                    <span style="
                        display:inline-flex;
                        align-items:center;
                        gap:7px;
                        white-space:nowrap;
                    ">
                        <span style="
                            width:8px;
                            height:8px;
                            border-radius:50%;
                            background:${color};
                            box-shadow:0 0 8px ${color};
                        "></span>
                        ${escapeHTML(name)}
                    </span>
                `).join("")}
            </div>
        `;

        container.appendChild(legend);
    }

    /*
     * ------------------------------------------------------------
     * RESPONSIVE
     * ------------------------------------------------------------
     */

    let resizeTimer = null;

    function setupResize() {
        window.addEventListener(
            "resize",
            () => {
                clearTimeout(resizeTimer);

                resizeTimer = setTimeout(() => {
                    const container =
                        getGraphContainer();

                    if (!container || !svg) {
                        return;
                    }

                    calculateGraphSize(
                        container
                    );

                    svg
                        .attr(
                            "height",
                            height
                        )
                        .attr(
                            "viewBox",
                            `0 0 ${width} ${height}`
                        );

                    svg
                        .select(
                            ".fg-graph-background"
                        )
                        .attr(
                            "width",
                            width
                        )
                        .attr(
                            "height",
                            height
                        );

                    svg
                        .select(
                            ".fg-graph-grid"
                        )
                        .attr(
                            "width",
                            width
                        )
                        .attr(
                            "height",
                            height
                        );

                    if (simulation) {
                        simulation
                            .force(
                                "center",
                                window.d3.forceCenter(
                                    width / 2,
                                    height / 2
                                )
                            )
                            .force(
                                "x",
                                window.d3
                                    .forceX(
                                        width / 2
                                    )
                                    .strength(0.045)
                            )
                            .force(
                                "y",
                                window.d3
                                    .forceY(
                                        height / 2
                                    )
                                    .strength(0.045)
                            )
                            .alpha(0.5)
                            .restart();
                    }
                }, 180);
            }
        );
    }

    /*
     * ------------------------------------------------------------
     * LOAD + RENDER
     * ------------------------------------------------------------
     */

    async function loadAndRender() {
        const container =
            getGraphContainer();

        if (!container) {
            console.error(
                "KNOWLEDGE GRAPH: Graph container not found."
            );

            return;
        }

        /*
         * Remove old loading UI.
         */

        removeInitializingOverlay();

        /*
         * Make sure graph host does not collapse.
         */

        container.classList.add(
            "fg-graph-host"
        );

        /*
         * Fetch actual Neo4j data.
         */

        const data =
            await fetchGraph();

        /*
         * If no data, show clean message.
         */

        if (
            !data.nodes ||
            data.nodes.length === 0
        ) {
            showGraphMessage(
                "No Knowledge Graph data",
                "Neo4j returned no nodes."
            );

            return;
        }

        /*
         * Render.
         */

        prepareData(data);

        renderGraph(container);

        createLegend(container);

        /*
         * Remove loading UI one more time because
         * some dashboard templates recreate it.
         */

        removeInitializingOverlay();
    }

    /*
     * ------------------------------------------------------------
     * INITIALIZE
     * ------------------------------------------------------------
     */

    async function initializeKnowledgeGraph() {
        console.log(
            "KNOWLEDGE GRAPH: Initializing..."
        );

        removeInitializingOverlay();

        try {
            await loadD3();

            removeInitializingOverlay();

            setupSearch();
            setupTypeFilter();
            setupRefreshButton();
            setupResetButton();
            setupResize();

            await loadAndRender();

            removeInitializingOverlay();

            console.log(
                "KNOWLEDGE GRAPH: Ready."
            );
        } catch (error) {
            console.error(
                "KNOWLEDGE GRAPH INITIALIZATION ERROR:",
                error
            );

            showGraphMessage(
                "Knowledge Graph failed to initialize",
                error.message ||
                    "Please check the browser console."
            );
        }
    }

    /*
     * ------------------------------------------------------------
     * PUBLIC API
     * ------------------------------------------------------------
     */

    window.FinGuardKnowledgeGraph = {
        reload: loadAndRender,

        reset: resetGraphView,

        refresh: refreshGraphView,

        getData: () => currentData
    };

    /*
     * ------------------------------------------------------------
     * START
     * ------------------------------------------------------------
     */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeKnowledgeGraph,
            { once: true }
        );
    } else {
        initializeKnowledgeGraph();
    }

})();
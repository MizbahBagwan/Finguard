(() => {
    "use strict";

    /*
     * ============================================================
     * FinGuard AI - Knowledge Graph
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

    let resizeTimer = null;


    /* ============================================================
       DOM HELPERS
       ============================================================ */

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
            "#graph",
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
            "#nodeSearch",
            "#graphSearch",
            "#knowledgeGraphSearch",
            "#knowledge-graph-search",
            "input[placeholder*='Search transaction']",
            "input[placeholder*='Search Transaction']",
            "input[placeholder*='Search node']"
        ]);
    }


    function getTypeSelect() {
        return findElement([
            "#nodeType",
            "#graphNodeType",
            "#knowledgeGraphType",
            "#knowledge-graph-type"
        ]);
    }


    function getRefreshButton() {
        return findElement([
            "#refreshGraph",
            "#refreshNetwork",
            "#refresh-graph",
            "#refresh-network"
        ]);
    }


    function getResetButton() {
        return findElement([
            "#resetGraph",
            "#resetView",
            "#reset-view"
        ]);
    }


    /* ============================================================
       LOADING UI
       ============================================================ */

    function removeInitializingOverlay() {
        const selectors = [
            "#graphLoader",
            "#knowledgeGraphLoader",
            "#knowledge-graph-loader",
            ".graph-loader",
            ".knowledge-graph-loader",
            ".graph-loading",
            ".knowledge-graph-loading",
            "[data-graph-loader]"
        ];

        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => {
                element.remove();
            });
        });

        document.querySelectorAll("body *").forEach((element) => {

            if (element.children.length) {
                return;
            }

            const text = (
                element.textContent || ""
            )
                .trim()
                .toLowerCase();

            if (
                text.includes("initializing ai network") ||
                text.includes("loading relationship intelligence")
            ) {
                const parent = element.parentElement;

                if (
                    parent &&
                    parent !== document.body
                ) {
                    parent.style.display = "none";
                } else {
                    element.style.display = "none";
                }
            }
        });
    }


    /* ============================================================
       LOAD D3
       ============================================================ */

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

                existing.addEventListener(
                    "load",
                    () => {
                        if (window.d3) {
                            resolve(window.d3);
                        } else {
                            reject(
                                new Error(
                                    "D3 loaded but window.d3 is unavailable."
                                )
                            );
                        }
                    },
                    { once: true }
                );

                existing.addEventListener(
                    "error",
                    () => {
                        reject(
                            new Error("Unable to load D3.")
                        );
                    },
                    { once: true }
                );

                return;
            }

            const script = document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js";

            script.async = true;

            script.onload = () => {

                if (window.d3) {
                    resolve(window.d3);
                } else {
                    reject(
                        new Error(
                            "D3 loaded but window.d3 is unavailable."
                        )
                    );
                }
            };

            script.onerror = () => {
                reject(
                    new Error(
                        "Unable to load D3 from CDN."
                    )
                );
            };

            document.head.appendChild(script);
        });

        return d3ReadyPromise;
    }


    /* ============================================================
       NORMALIZE TYPE
       ============================================================ */

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


    /* ============================================================
       NODE COLOR
       ============================================================ */

    function getNodeColor(type) {

        const normalized = normalizeType(type);

        const colors = {
            Transaction: "#22d3ee",
            Account: "#818cf8",
            Merchant: "#a78bfa",
            Device: "#22c55e",
            Card: "#f59e0b",
            "Fraud Alert": "#ef4444",
            User: "#38bdf8",
            Location: "#22d3ee",
            Unknown: "#64748b"
        };

        return colors[normalized] || colors.Unknown;
    }


    /* ============================================================
       NODE LABEL
       ============================================================ */

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
            properties.id,
            node.id
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

        return "Unknown";
    }


    function shortLabel(value, maxLength = 24) {

        const text = String(value || "");

        if (text.length <= maxLength) {
            return text;
        }

        return `${text.substring(0, maxLength - 1)}…`;
    }


    /* ============================================================
       RELATIONSHIP ID
       ============================================================ */

    function getEndpointId(endpoint) {

        if (
            endpoint === null ||
            endpoint === undefined
        ) {
            return null;
        }

        if (
            typeof endpoint === "object"
        ) {

            return String(
                endpoint.id ??
                endpoint.elementId ??
                endpoint.identity ??
                ""
            );
        }

        return String(endpoint);
    }


    /* ============================================================
       FETCH GRAPH
       ============================================================ */

    async function fetchGraph() {

        console.log(
            "KNOWLEDGE GRAPH: Connecting to Neo4j..."
        );

        try {

            const response = await fetch(
                API_URL,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    cache: "no-store"
                }
            );

            if (!response.ok) {

                throw new Error(
                    `Knowledge Graph API failed: ${response.status}`
                );
            }

            const data = await response.json();

            if (
                !data ||
                typeof data !== "object"
            ) {
                throw new Error(
                    "Invalid Knowledge Graph response."
                );
            }

            const nodes = Array.isArray(data.nodes)
                ? data.nodes
                : [];

            const relationships =
                Array.isArray(data.relationships)
                    ? data.relationships
                    : [];

            console.log(
                `KNOWLEDGE GRAPH: ${nodes.length} nodes, ${relationships.length} relationships`
            );

            return {
                nodes,
                relationships
            };

        } catch (error) {

            console.error(
                "KNOWLEDGE GRAPH ERROR:",
                error
            );

            showGraphMessage(
                "Unable to load Knowledge Graph",
                error.message ||
                "Neo4j connection failed."
            );

            return {
                nodes: [],
                relationships: []
            };
        }
    }


    /* ============================================================
       PREPARE DATA

       IMPORTANT:
       This function returns the prepared data.
       loadAndRender() assigns it to currentData.
       ============================================================ */

    function prepareData(data) {

        const nodes = (
            Array.isArray(data.nodes)
                ? data.nodes
                : []
        )
            .filter(Boolean)
            .map((node, index) => {

                const id = String(
                    node.id ??
                    node.elementId ??
                    node.identity ??
                    `node-${index}`
                );

                return {
                    ...node,
                    id,
                    graphType: normalizeType(
                        node.type ??
                        node.label ??
                        node.labels?.[0]
                    ),
                    graphLabel: getNodeLabel({
                        ...node,
                        id
                    }),
                    properties:
                        node.properties || {}
                };
            });


        const nodeIds = new Set(
            nodes.map((node) => String(node.id))
        );


        const links = (
            Array.isArray(data.relationships)
                ? data.relationships
                : []
        )
            .filter(Boolean)
            .map((relationship) => {

                const source =
                    getEndpointId(
                        relationship.source ??
                        relationship.start ??
                        relationship.from ??
                        relationship.startNode
                    );

                const target =
                    getEndpointId(
                        relationship.target ??
                        relationship.end ??
                        relationship.to ??
                        relationship.endNode
                    );

                return {
                    source,
                    target,
                    type: String(
                        relationship.type ||
                        relationship.label ||
                        "RELATED"
                    )
                };
            })
            .filter((relationship) => {

                return (
                    relationship.source &&
                    relationship.target &&
                    nodeIds.has(
                        String(relationship.source)
                    ) &&
                    nodeIds.has(
                        String(relationship.target)
                    ) &&
                    relationship.source !==
                        relationship.target
                );
            });


        return {
            nodes,
            relationships: links
        };
    }


    /* ============================================================
       FILTER DATA
       ============================================================ */

    function getFilteredData() {

        const search =
            currentSearch
                .trim()
                .toLowerCase();

        const type =
            currentType
                .trim()
                .toLowerCase();


        let nodes = currentData.nodes.map(
            (node) => ({
                ...node,
                id: String(node.id),
                graphType:
                    node.graphType ||
                    normalizeType(node.type),
                graphLabel:
                    node.graphLabel ||
                    getNodeLabel(node)
            })
        );


        if (type !== "all") {

            nodes = nodes.filter(
                (node) => {

                    return (
                        normalizeType(
                            node.graphType
                        ).toLowerCase() === type
                    );
                }
            );
        }


        if (search) {

            nodes = nodes.filter(
                (node) => {

                    const searchable = [
                        node.graphLabel,
                        node.id,
                        node.graphType,
                        JSON.stringify(
                            node.properties || {}
                        )
                    ]
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        search
                    );
                }
            );
        }


        const allowedIds = new Set(
            nodes.map(
                (node) => String(node.id)
            )
        );


        const links =
            currentData.relationships
                .filter((relationship) => {

                    const source =
                        getEndpointId(
                            relationship.source
                        );

                    const target =
                        getEndpointId(
                            relationship.target
                        );

                    return (
                        allowedIds.has(source) &&
                        allowedIds.has(target)
                    );
                })
                .map((relationship) => ({
                    source:
                        getEndpointId(
                            relationship.source
                        ),
                    target:
                        getEndpointId(
                            relationship.target
                        ),
                    type:
                        String(
                            relationship.type ||
                            "RELATED"
                        )
                }));


        return {
            nodes,
            links
        };
    }


    /* ============================================================
       GRAPH SIZE
       ============================================================ */

    function calculateGraphSize(container) {

        const rect =
            container.getBoundingClientRect();

        width = Math.max(
            700,
            Math.floor(
                rect.width || 1000
            )
        );


        height = Math.max(
            560,
            Math.min(
                760,
                Math.floor(
                    window.innerHeight * 0.68
                )
            )
        );
    }


    /* ============================================================
       CREATE SVG
       ============================================================ */

    function createSVG(container) {

        const d3 = window.d3;

        calculateGraphSize(container);


        if (simulation) {
            simulation.stop();
            simulation = null;
        }


        container
            .querySelectorAll(
                "svg.finguard-knowledge-graph"
            )
            .forEach(
                (element) =>
                    element.remove()
            );


        container
            .querySelectorAll(
                ".fg-graph-message"
            )
            .forEach(
                (element) =>
                    element.remove()
            );


        const svgElement = d3
            .select(container)
            .append("svg")
            .attr(
                "class",
                "finguard-knowledge-graph"
            )
            .attr(
                "width",
                "100%"
            )
            .attr(
                "height",
                height
            )
            .attr(
                "viewBox",
                `0 0 ${width} ${height}`
            )
            .attr(
                "preserveAspectRatio",
                "xMidYMid meet"
            )
            .style(
                "display",
                "block"
            )
            .style(
                "width",
                "100%"
            )
            .style(
                "height",
                `${height}px`
            )
            .style(
                "cursor",
                "grab"
            );


        svg = svgElement;


        /* --------------------------------------------------------
           DEFINITIONS
           -------------------------------------------------------- */

        const defs =
            svg.append("defs");


        /* Grid */

        const pattern =
            defs
                .append("pattern")
                .attr(
                    "id",
                    "fg-grid-pattern"
                )
                .attr(
                    "width",
                    40
                )
                .attr(
                    "height",
                    40
                )
                .attr(
                    "patternUnits",
                    "userSpaceOnUse"
                );


        pattern
            .append("path")
            .attr(
                "d",
                "M 40 0 L 0 0 0 40"
            )
            .attr(
                "fill",
                "none"
            )
            .attr(
                "stroke",
                "#172033"
            )
            .attr(
                "stroke-width",
                0.7
            )
            .attr(
                "opacity",
                0.45
            );


        /* Arrow */

        defs
            .append("marker")
            .attr(
                "id",
                "fg-arrow"
            )
            .attr(
                "viewBox",
                "0 -5 10 10"
            )
            .attr(
                "refX",
                14
            )
            .attr(
                "refY",
                0
            )
            .attr(
                "markerWidth",
                7
            )
            .attr(
                "markerHeight",
                7
            )
            .attr(
                "orient",
                "auto"
            )
            .append("path")
            .attr(
                "d",
                "M0,-5L10,0L0,5"
            )
            .attr(
                "fill",
                "#64748b"
            )
            .attr(
                "opacity",
                0.8
            );


        /* Node glow */

        const glow =
            defs
                .append("filter")
                .attr(
                    "id",
                    "fg-node-glow"
                )
                .attr(
                    "x",
                    "-100%"
                )
                .attr(
                    "y",
                    "-100%"
                )
                .attr(
                    "width",
                    "300%"
                )
                .attr(
                    "height",
                    "300%"
                );


        glow
            .append("feGaussianBlur")
            .attr(
                "stdDeviation",
                4
            )
            .attr(
                "result",
                "blur"
            );


        const merge =
            glow.append("feMerge");


        merge
            .append("feMergeNode")
            .attr(
                "in",
                "blur"
            );


        merge
            .append("feMergeNode")
            .attr(
                "in",
                "SourceGraphic"
            );


        /* --------------------------------------------------------
           BACKGROUND
           -------------------------------------------------------- */

        svg
            .append("rect")
            .attr(
                "class",
                "fg-graph-background"
            )
            .attr(
                "width",
                width
            )
            .attr(
                "height",
                height
            )
            .attr(
                "fill",
                "#030916"
            );


        svg
            .append("rect")
            .attr(
                "class",
                "fg-graph-grid"
            )
            .attr(
                "width",
                width
            )
            .attr(
                "height",
                height
            )
            .attr(
                "fill",
                "url(#fg-grid-pattern)"
            )
            .attr(
                "opacity",
                0.55
            );


        /* --------------------------------------------------------
           ROOT
           -------------------------------------------------------- */

        graphRoot =
            svg
                .append("g")
                .attr(
                    "class",
                    "fg-graph-root"
                );


        /* --------------------------------------------------------
           ZOOM
           -------------------------------------------------------- */

        zoomBehavior =
            d3
                .zoom()
                .scaleExtent([
                    0.25,
                    4
                ])
                .on(
                    "start",
                    () => {
                        svg.style(
                            "cursor",
                            "grabbing"
                        );
                    }
                )
                .on(
                    "zoom",
                    (event) => {

                        graphRoot.attr(
                            "transform",
                            event.transform
                        );
                    }
                )
                .on(
                    "end",
                    () => {
                        svg.style(
                            "cursor",
                            "grab"
                        );
                    }
                );


        svg.call(
            zoomBehavior
        );


        svg.on(
            "dblclick.zoom",
            null
        );


        return svg;
    }


    /* ============================================================
       GRAPH CONTROLS
       ============================================================ */

    function createGraphControls(container) {

        container
            .querySelectorAll(
                ".fg-graph-controls"
            )
            .forEach(
                (element) =>
                    element.remove()
            );


        const controls =
            document.createElement(
                "div"
            );


        controls.className =
            "fg-graph-controls";


        controls.innerHTML = `
            <button
                type="button"
                data-fg-action="zoom-in"
                title="Zoom in">
                +
            </button>

            <button
                type="button"
                data-fg-action="zoom-out"
                title="Zoom out">
                −
            </button>

            <button
                type="button"
                data-fg-action="reset"
                title="Reset graph">
                Reset
            </button>
        `;


        container.appendChild(
            controls
        );


        controls
            .querySelectorAll(
                "[data-fg-action]"
            )
            .forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                !svg ||
                                !zoomBehavior
                            ) {
                                return;
                            }


                            const action =
                                button.dataset
                                    .fgAction;


                            if (
                                action ===
                                "zoom-in"
                            ) {

                                svg
                                    .transition()
                                    .duration(250)
                                    .call(
                                        zoomBehavior
                                            .scaleBy,
                                        1.3
                                    );
                            }


                            if (
                                action ===
                                "zoom-out"
                            ) {

                                svg
                                    .transition()
                                    .duration(250)
                                    .call(
                                        zoomBehavior
                                            .scaleBy,
                                        0.77
                                    );
                            }


                            if (
                                action ===
                                "reset"
                            ) {
                                resetGraphView();
                            }
                        }
                    );
                }
            );
    }


    /* ============================================================
       RESET
       ============================================================ */

    function resetGraphView() {

        if (
            !svg ||
            !zoomBehavior
        ) {
            return;
        }


        svg
            .transition()
            .duration(450)
            .call(
                zoomBehavior.transform,
                window.d3.zoomIdentity
            );


        if (simulation) {

            simulation
                .alpha(0.5)
                .restart();
        }
    }


    /* ============================================================
       RENDER GRAPH
       ============================================================ */

    function renderGraph() {
    const container = document.getElementById("graph");

    if (!container) {
        console.error("Knowledge Graph: #graph not found");
        return;
    }

    if (!window.d3) {
        console.error("Knowledge Graph: D3 not loaded");
        return;
    }

    const d3 = window.d3;

    // ------------------------------------------------------------
    // USE THE DATA ALREADY PREPARED BY YOUR EXISTING CODE
    // ------------------------------------------------------------

    const sourceNodes = Array.isArray(currentData?.nodes)
        ? currentData.nodes
        : [];

    const sourceRelationships = Array.isArray(currentData?.relationships)
        ? currentData.relationships
        : [];

    console.log(
        "GRAPH RENDER:",
        sourceNodes.length,
        "nodes,",
        sourceRelationships.length,
        "relationships"
    );

    // ------------------------------------------------------------
    // FILTER
    // ------------------------------------------------------------

    const searchInput = document.getElementById("nodeSearch");
    const typeSelect = document.getElementById("nodeType");

    const searchValue = (
        searchInput?.value || ""
    ).trim().toLowerCase();

    const selectedType = (
        typeSelect?.value || "all"
    ).trim().toLowerCase();

    let nodes = sourceNodes.map((node) => ({
        ...node,
        id: String(node.id),
        type: node.type || node.graphType || "Unknown",
        label: node.label || node.graphLabel || node.id,
        properties: node.properties || {}
    }));

    // Filter node type
    if (selectedType !== "all") {
        nodes = nodes.filter((node) => {
            const nodeType = String(
                node.type ||
                node.graphType ||
                ""
            ).toLowerCase();

            return nodeType === selectedType;
        });
    }

    // Search
    if (searchValue) {
        nodes = nodes.filter((node) => {
            const searchable = [
                node.id,
                node.label,
                node.type,
                JSON.stringify(node.properties || {})
            ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(searchValue);
        });
    }

    // ------------------------------------------------------------
    // IMPORTANT:
    // ONLY KEEP REAL RELATIONSHIPS
    // ------------------------------------------------------------

    const nodeIds = new Set(
        nodes.map(node => String(node.id))
    );

    function endpointId(endpoint) {
        if (
            endpoint === null ||
            endpoint === undefined
        ) {
            return null;
        }

        if (typeof endpoint === "object") {
            return String(
                endpoint.id ??
                endpoint.elementId ??
                endpoint.identity ??
                ""
            );
        }

        return String(endpoint);
    }

    const links = sourceRelationships
        .map((relationship) => ({
            source: endpointId(
                relationship.source ??
                relationship.start ??
                relationship.from
            ),

            target: endpointId(
                relationship.target ??
                relationship.end ??
                relationship.to
            ),

            type: relationship.type ||
                relationship.label ||
                "RELATED"
        }))
        .filter((link) => {
            return (
                link.source &&
                link.target &&
                nodeIds.has(link.source) &&
                nodeIds.has(link.target)
            );
        });

    console.log(
        "GRAPH FILTERED:",
        nodes.length,
        "nodes,",
        links.length,
        "real relationships"
    );

    // ------------------------------------------------------------
    // EMPTY
    // ------------------------------------------------------------

    const empty = document.getElementById("graphEmpty");

    if (empty) {
        empty.style.display =
            nodes.length === 0
                ? "flex"
                : "none";
    }

    if (!nodes.length) {
        return;
    }

    // ------------------------------------------------------------
    // CLEAR ONLY SVG
    // ------------------------------------------------------------

    d3.select(container)
        .selectAll("svg")
        .remove();

    // Remove old graph controls if your previous render created them
    d3.select(container)
        .selectAll(".kg-graph-controls")
        .remove();

    // ------------------------------------------------------------
    // SIZE
    // ------------------------------------------------------------

    const rect = container.getBoundingClientRect();

    const width = Math.max(
        800,
        Math.floor(rect.width || 1000)
    );

    const height = Math.max(
        560,
        Math.floor(
            Math.min(
                720,
                window.innerHeight * 0.68
            )
        )
    );

    // ------------------------------------------------------------
    // SVG
    // ------------------------------------------------------------

    const svg = d3
        .select(container)
        .append("svg")
        .attr("class", "kg-real-graph")
        .attr("width", "100%")
        .attr("height", height)
        .attr(
            "viewBox",
            `0 0 ${width} ${height}`
        )
        .style("display", "block");

    // ------------------------------------------------------------
    // DEFS
    // ------------------------------------------------------------

    const defs = svg.append("defs");

    defs.append("marker")
        .attr("id", "kg-arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 18)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#52627a");

    // ------------------------------------------------------------
    // ZOOM ROOT
    // ------------------------------------------------------------

    const root = svg
        .append("g")
        .attr("class", "kg-graph-root");

    const zoom = d3
        .zoom()
        .scaleExtent([0.25, 4])
        .on("zoom", (event) => {
            root.attr(
                "transform",
                event.transform
            );
        });

    svg.call(zoom);

    // ------------------------------------------------------------
    // LINK LAYER
    // ------------------------------------------------------------

    const linkLayer = root
        .append("g")
        .attr("class", "kg-links");

    const link = linkLayer
        .selectAll("line")
        .data(
            links,
            d =>
                `${d.source}-${d.target}-${d.type}`
        )
        .join("line")
        .attr("stroke", "#43536d")
        .attr("stroke-width", 1.4)
        .attr("stroke-opacity", 0.72)
        .attr(
            "marker-end",
            "url(#kg-arrow)"
        );

    // ------------------------------------------------------------
    // LINK LABEL
    // ------------------------------------------------------------

    const linkLabels = root
        .append("g")
        .attr("class", "kg-link-labels")
        .selectAll("text")
        .data(
            links,
            d =>
                `${d.source}-${d.target}-${d.type}`
        )
        .join("text")
        .attr("fill", "#73839b")
        .attr("font-size", 8)
        .attr("text-anchor", "middle")
        .style("pointer-events", "none")
        .style("paint-order", "stroke")
        .style("stroke", "#050b15")
        .style("stroke-width", "4px")
        .text(d =>
            String(d.type)
                .replace(/_/g, " ")
                .toUpperCase()
        );

    // ------------------------------------------------------------
    // NODE LAYER
    // ------------------------------------------------------------

    const nodeLayer = root
        .append("g")
        .attr("class", "kg-nodes");

    const node = nodeLayer
        .selectAll("g")
        .data(
            nodes,
            d => String(d.id)
        )
        .join("g")
        .attr("class", "kg-node")
        .style("cursor", "pointer");

    // ------------------------------------------------------------
    // COLORS
    // ------------------------------------------------------------

    function nodeColor(type) {

        const normalized = String(
            type || ""
        )
            .toLowerCase()
            .replace(/\s+/g, "");

        if (normalized === "transaction") {
            return "#22d3ee";
        }

        if (normalized === "account") {
            return "#818cf8";
        }

        if (normalized === "merchant") {
            return "#a78bfa";
        }

        if (normalized === "device") {
            return "#22c55e";
        }

        if (normalized === "card") {
            return "#f59e0b";
        }

        if (
            normalized === "fraudalert" ||
            normalized === "fraud-alert"
        ) {
            return "#ef4444";
        }

        if (normalized === "fraudring") {
            return "#fb7185";
        }

        if (normalized === "user") {
            return "#38bdf8";
        }

        if (
            normalized === "location" ||
            normalized === "ipaddress"
        ) {
            return "#06b6d4";
        }

        return "#64748b";
    }

    // ------------------------------------------------------------
    // NODE CIRCLE
    // ------------------------------------------------------------

    node.append("circle")
        .attr("r", d => {

            const type = String(
                d.type || ""
            ).toLowerCase();

            if (
                type === "transaction"
            ) {
                return 14;
            }

            if (
                type === "fraudalert" ||
                type === "fraud alert"
            ) {
                return 14;
            }

            return 11;
        })
        .attr(
            "fill",
            d => nodeColor(d.type)
        )
        .attr(
            "stroke",
            "#e2e8f0"
        )
        .attr(
            "stroke-width",
            1.2
        );

    // ------------------------------------------------------------
    // NODE LABEL
    // ------------------------------------------------------------

    node.append("text")
        .attr("x", 16)
        .attr("y", 4)
        .attr("fill", "#e7eef9")
        .attr("font-size", 10)
        .attr("font-weight", 600)
        .style("pointer-events", "none")
        .style("paint-order", "stroke")
        .style("stroke", "#050b15")
        .style("stroke-width", "4px")
        .text(d => {

            const label =
                d.label ||
                d.properties?.name ||
                d.id;

            const text =
                String(label);

            return text.length > 28
                ? text.substring(0, 27) + "…"
                : text;
        });

    // ------------------------------------------------------------
    // NODE TYPE
    // ------------------------------------------------------------

    node.append("text")
        .attr("x", 16)
        .attr("y", 17)
        .attr("fill", "#64748b")
        .attr("font-size", 8)
        .style("pointer-events", "none")
        .text(d =>
            String(d.type)
        );

    // ------------------------------------------------------------
    // TOOLTIP
    // ------------------------------------------------------------

    node.append("title")
        .text(d => {

            const properties =
                Object.entries(
                    d.properties || {}
                )
                    .slice(0, 8)
                    .map(
                        ([key, value]) =>
                            `${key}: ${value}`
                    )
                    .join("\n");

            return [
                d.label,
                `Type: ${d.type}`,
                properties
            ]
                .filter(Boolean)
                .join("\n");
        });

    // ------------------------------------------------------------
    // NODE CLICK
    // ------------------------------------------------------------

    // ------------------------------------------------------------
// NODE CLICK / SELECTION
// ------------------------------------------------------------

let selectedNodeId = null;
let dragMoved = false;


// Highlight selected node and its neighbours
function selectNode(selectedNode) {

    if (!selectedNode) {
        return;
    }

    const selectedId =
        String(selectedNode.id);

    selectedNodeId = selectedId;

    const connected = new Set([
        selectedId
    ]);


    // Find connected nodes
    links.forEach((linkData) => {

        const source =
            endpointId(linkData.source);

        const target =
            endpointId(linkData.target);


        if (source === selectedId) {
            connected.add(target);
        }

        if (target === selectedId) {
            connected.add(source);
        }
    });


    // --------------------------------------------------------
    // NODE OPACITY
    // --------------------------------------------------------

    node
        .interrupt()
        .transition()
        .duration(150)
        .style(
            "opacity",
            (d) => {

                return connected.has(
                    String(d.id)
                )
                    ? 1
                    : 0.15;
            }
        );


    // --------------------------------------------------------
    // LINKS
    // --------------------------------------------------------

    link
        .interrupt()
        .attr(
            "stroke",
            (d) => {

                const source =
                    endpointId(d.source);

                const target =
                    endpointId(d.target);


                return (
                    source === selectedId ||
                    target === selectedId
                )
                    ? "#22d3ee"
                    : "#334155";
            }
        )
        .attr(
            "stroke-width",
            (d) => {

                const source =
                    endpointId(d.source);

                const target =
                    endpointId(d.target);


                return (
                    source === selectedId ||
                    target === selectedId
                )
                    ? 2.8
                    : 1;
            }
        )
        .attr(
            "stroke-opacity",
            (d) => {

                const source =
                    endpointId(d.source);

                const target =
                    endpointId(d.target);


                return (
                    source === selectedId ||
                    target === selectedId
                )
                    ? 1
                    : 0.25;
            }
        );


    // --------------------------------------------------------
    // LINK LABELS
    // --------------------------------------------------------

    linkLabels
        .style(
            "opacity",
            (d) => {

                const source =
                    endpointId(d.source);

                const target =
                    endpointId(d.target);


                return (
                    source === selectedId ||
                    target === selectedId
                )
                    ? 1
                    : 0.1;
            }
        );


    // --------------------------------------------------------
    // SELECTED NODE VISUAL
    // --------------------------------------------------------

    node
        .select("circle")
        .attr(
            "stroke",
            (d) =>
                String(d.id) === selectedId
                    ? "#ffffff"
                    : "#e2e8f0"
        )
        .attr(
            "stroke-width",
            (d) =>
                String(d.id) === selectedId
                    ? 3
                    : 1.2
        );


    // --------------------------------------------------------
    // DETAILS PANEL
    // --------------------------------------------------------

    showNodeDetails(selectedNode);
}


// ------------------------------------------------------------
// DIRECT NODE CLICK
// ------------------------------------------------------------

node.on(
    "click",
    function(event, selectedNode) {

        // IMPORTANT:
        // Stop event from reaching SVG background.
        event.preventDefault();
        event.stopPropagation();


        // Ignore click generated after dragging.
        if (dragMoved) {
            dragMoved = false;
            return;
        }


        console.log(
            "KNOWLEDGE GRAPH NODE CLICK:",
            selectedNode
        );


        selectNode(selectedNode);
    }
);


// ------------------------------------------------------------
// ALSO MAKE CIRCLE DIRECTLY CLICKABLE
// ------------------------------------------------------------

node
    .select("circle")
    .style(
        "pointer-events",
        "all"
    )
    .style(
        "cursor",
        "pointer"
    )
    .on(
        "click",
        function(event, selectedNode) {

            event.preventDefault();
            event.stopPropagation();


            if (dragMoved) {
                dragMoved = false;
                return;
            }


            console.log(
                "NODE CIRCLE CLICK:",
                selectedNode.id
            );


            selectNode(selectedNode);
        }
    );


// ------------------------------------------------------------
// CLEAR SELECTION
// ------------------------------------------------------------

svg.on(
    "click",
    function(event) {

        // Only clear when the actual SVG/background
        // was clicked.
        if (
            event.target !==
            this
        ) {
            return;
        }


        selectedNodeId = null;


        node
            .interrupt()
            .transition()
            .duration(150)
            .style(
                "opacity",
                1
            );


        link
            .attr(
                "stroke",
                "#43536d"
            )
            .attr(
                "stroke-width",
                1.4
            )
            .attr(
                "stroke-opacity",
                0.72
            );


        linkLabels
            .style(
                "opacity",
                1
            );


        node
            .select("circle")
            .attr(
                "stroke",
                "#e2e8f0"
            )
            .attr(
                "stroke-width",
                1.2
            );
    }
);

    // ------------------------------------------------------------
    // FORCE SIMULATION
    // ------------------------------------------------------------

    simulation = d3
        .forceSimulation(nodes)

        // REAL relationships ONLY
        .force(
            "link",
            d3.forceLink(links)
                .id(d => String(d.id))
                .distance(105)
                .strength(0.85)
        )

        // Keep nodes close enough to form ONE graph
        .force(
            "charge",
            d3.forceManyBody()
                .strength(-115)
                .distanceMin(20)
                .distanceMax(350)
        )

        // Center
        .force(
            "center",
            d3.forceCenter(
                width / 2,
                height / 2
            )
        )

        // Gentle center pull
        .force(
            "x",
            d3.forceX(
                width / 2
            ).strength(0.045)
        )

        .force(
            "y",
            d3.forceY(
                height / 2
            ).strength(0.045)
        )

        // Prevent overlap
        .force(
            "collision",
            d3.forceCollide()
                .radius(25)
                .strength(0.8)
        )

        .alpha(1)
        .alphaDecay(0.025)
        .velocityDecay(0.48)

        .on(
            "tick",
            () => {

                link
                    .attr(
                        "x1",
                        d => d.source.x
                    )
                    .attr(
                        "y1",
                        d => d.source.y
                    )
                    .attr(
                        "x2",
                        d => d.target.x
                    )
                    .attr(
                        "y2",
                        d => d.target.y
                    );

                linkLabels
                    .attr(
                        "x",
                        d =>
                            (
                                d.source.x +
                                d.target.x
                            ) / 2
                    )
                    .attr(
                        "y",
                        d =>
                            (
                                d.source.y +
                                d.target.y
                            ) / 2 - 5
                    );

                node.attr(
                    "transform",
                    d =>
                        `translate(${d.x},${d.y})`
                );
            }
        );

    // ------------------------------------------------------------
    // DRAG
    // ------------------------------------------------------------

    // ------------------------------------------------------------
// DRAG
// ------------------------------------------------------------

const dragBehavior =
    d3
        .drag()

        .on(
            "start",
            function(event, d) {

                dragMoved = false;


                if (
                    !event.active &&
                    simulation
                ) {
                    simulation
                        .alphaTarget(0.25)
                        .restart();
                }


                d.fx = d.x;
                d.fy = d.y;


                console.log(
                    "NODE DRAG START:",
                    d.id
                );
            }
        )

        .on(
            "drag",
            function(event, d) {

                const dx =
                    Math.abs(
                        event.x - d.x
                    );

                const dy =
                    Math.abs(
                        event.y - d.y
                    );


                // Consider it a drag only after
                // meaningful movement.
                if (
                    dx > 3 ||
                    dy > 3
                ) {
                    dragMoved = true;
                }


                d.fx = event.x;
                d.fy = event.y;
            }
        )

        .on(
            "end",
            function(event, d) {

                if (
                    !event.active &&
                    simulation
                ) {
                    simulation
                        .alphaTarget(0);
                }


                d.fx = null;
                d.fy = null;


                console.log(
                    "NODE DRAG END:",
                    d.id
                );


                // Keep suppress flag for one event cycle.
                if (dragMoved) {

                    setTimeout(
                        () => {
                            dragMoved = false;
                        },
                        50
                    );
                }
            }
        );


node.call(
    dragBehavior
);
    // ------------------------------------------------------------
    // START POSITIONS
    // ------------------------------------------------------------

    nodes.forEach(
        (d, i) => {

            const angle =
                (
                    i /
                    Math.max(
                        nodes.length,
                        1
                    )
                ) *
                Math.PI *
                2;

            const radius =
                Math.min(
                    width,
                    height
                ) * 0.16;

            d.x =
                width / 2 +
                Math.cos(angle) *
                radius;

            d.y =
                height / 2 +
                Math.sin(angle) *
                radius;
        }
    );

    simulation
        .alpha(1)
        .restart();

    // ------------------------------------------------------------
    // HIDE LOADING
    // ------------------------------------------------------------

    const loading =
        document.getElementById(
            "graphLoading"
        );

    if (loading) {
        loading.style.display =
            "none";
    }

    console.log(
        "GRAPH RENDER COMPLETE:",
        nodes.length,
        "nodes /",
        links.length,
        "relationships"
    );
}

    /* ============================================================
       INITIAL POSITIONS
       ============================================================ */

    function spreadInitialPositions(
        nodes
    ) {

        const centerX =
            width / 2;

        const centerY =
            height / 2;


        /*
         * Small radius.
         *
         * This avoids the huge separated
         * starting ring from the old version.
         */

        const radius =
            Math.min(
                width,
                height
            ) * 0.12;


        nodes.forEach(
            (node, index) => {

                const angle =
                    (
                        index /
                        Math.max(
                            nodes.length,
                            1
                        )
                    ) *
                    Math.PI *
                    2;


                const ring =
                    0.75 +
                    (
                        index % 4
                    ) * 0.08;


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


                node.vx = 0;
                node.vy = 0;
            }
        );


        if (simulation) {

            simulation
                .alpha(1)
                .restart();
        }
    }


    /* ============================================================
       UPDATE POSITIONS
       ============================================================ */

    function updatePositions(
        link,
        linkLabel,
        node
    ) {

        link
            .attr(
                "x1",
                (d) => d.source.x
            )
            .attr(
                "y1",
                (d) => d.source.y
            )
            .attr(
                "x2",
                (d) => d.target.x
            )
            .attr(
                "y2",
                (d) => d.target.y
            );


        linkLabel
            .attr(
                "x",
                (d) =>
                    (
                        d.source.x +
                        d.target.x
                    ) / 2
            )
            .attr(
                "y",
                (d) =>
                    (
                        d.source.y +
                        d.target.y
                    ) / 2 - 5
            );


        node.attr(
            "transform",
            (d) =>
                `translate(${d.x},${d.y})`
        );
    }


    /* ============================================================
       DRAG
       ============================================================ */

    function dragStarted(
        event,
        d
    ) {

        if (
            !event.active &&
            simulation
        ) {
            simulation
                .alphaTarget(0.25)
                .restart();
        }

        d.fx = d.x;
        d.fy = d.y;
    }


    function dragged(
        event,
        d
    ) {

        d.fx = event.x;
        d.fy = event.y;
    }


    function dragEnded(
        event,
        d
    ) {

        if (
            !event.active &&
            simulation
        ) {
            simulation
                .alphaTarget(0);
        }

        d.fx = null;
        d.fy = null;
    }


    /* ============================================================
       HIGHLIGHT
       ============================================================ */

    function highlightNode(
        selectedNode,
        node,
        link,
        linkLabel
    ) {

        const selectedId =
            String(
                selectedNode.id
            );


        const connectedIds =
            new Set([
                selectedId
            ]);


        currentLinks.forEach(
            (relationship) => {

                const sourceId =
                    getEndpointId(
                        relationship.source
                    );

                const targetId =
                    getEndpointId(
                        relationship.target
                    );


                if (
                    sourceId ===
                    selectedId
                ) {
                    connectedIds.add(
                        targetId
                    );
                }


                if (
                    targetId ===
                    selectedId
                ) {
                    connectedIds.add(
                        sourceId
                    );
                }
            }
        );


        node
            .transition()
            .duration(180)
            .style(
                "opacity",
                (d) =>
                    connectedIds.has(
                        String(d.id)
                    )
                        ? 1
                        : 0.16
            );


        link
            .transition()
            .duration(180)
            .attr(
                "stroke",
                (d) => {

                    const sourceId =
                        getEndpointId(
                            d.source
                        );

                    const targetId =
                        getEndpointId(
                            d.target
                        );


                    return (
                        sourceId ===
                            selectedId ||
                        targetId ===
                            selectedId
                    )
                        ? "#38bdf8"
                        : "#33445f";
                }
            )
            .attr(
                "stroke-width",
                (d) => {

                    const sourceId =
                        getEndpointId(
                            d.source
                        );

                    const targetId =
                        getEndpointId(
                            d.target
                        );


                    return (
                        sourceId ===
                            selectedId ||
                        targetId ===
                            selectedId
                    )
                        ? 2.4
                        : 1;
                }
            )
            .attr(
                "stroke-opacity",
                (d) => {

                    const sourceId =
                        getEndpointId(
                            d.source
                        );

                    const targetId =
                        getEndpointId(
                            d.target
                        );


                    return (
                        sourceId ===
                            selectedId ||
                        targetId ===
                            selectedId
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

                    const sourceId =
                        getEndpointId(
                            d.source
                        );

                    const targetId =
                        getEndpointId(
                            d.target
                        );


                    return (
                        sourceId ===
                            selectedId ||
                        targetId ===
                            selectedId
                    )
                        ? 1
                        : 0.1;
                }
            );
    }


    /* ============================================================
       CLEAR HIGHLIGHT
       ============================================================ */

    function clearHighlight(
        node,
        link,
        linkLabel
    ) {

        node
            .transition()
            .duration(180)
            .style(
                "opacity",
                1
            );


        link
            .transition()
            .duration(180)
            .attr(
                "stroke",
                "#33445f"
            )
            .attr(
                "stroke-width",
                1.25
            )
            .attr(
                "stroke-opacity",
                0.72
            );


        linkLabel
            .transition()
            .duration(180)
            .style(
                "opacity",
                1
            );
    }


    /* ============================================================
       MESSAGE
       ============================================================ */

    function showGraphMessage(
        title,
        message
    ) {

        const container =
            getGraphContainer();


        if (!container) {
            return;
        }


        container
            .querySelectorAll(
                ".fg-graph-message"
            )
            .forEach(
                (element) =>
                    element.remove()
            );


        const box =
            document.createElement(
                "div"
            );


        box.className =
            "fg-graph-message";


        box.style.cssText = `
            position:absolute;
            inset:0;
            z-index:20;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            text-align:center;
            background:#030916;
            color:#eef4ff;
            padding:40px;
            box-sizing:border-box;
        `;


        box.innerHTML = `
            <div style="
                width:12px;
                height:12px;
                border-radius:50%;
                background:#22d3ee;
                box-shadow:
                    0 0 18px
                    rgba(34,211,238,.65);
                margin-bottom:18px;
            "></div>

            <div style="
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
        `;


        container.appendChild(
            box
        );
    }

   window.showNodeDetails = function showNodeDetails(node) {

    if (!node) {
        return;
    }

    const properties =
        node.properties || {};

    const type =
        String(
            node.graphType ||
            node.type ||
            "Unknown"
        );

    const label =
        String(
            node.graphLabel ||
            node.label ||
            node.id ||
            "Unknown"
        );

    const container =
        getGraphContainer();

    if (!container) {
        return;
    }

    let panel =
        container.querySelector(
            ".kg-node-details"
        );

    if (!panel) {

        panel =
            document.createElement(
                "div"
            );

        panel.className =
            "kg-node-details";

        panel.style.cssText = `
            position:absolute;
            top:18px;
            right:18px;
            width:320px;
            max-width:calc(100% - 36px);
            max-height:calc(100% - 36px);
            overflow:auto;
            z-index:50;
            box-sizing:border-box;
            padding:20px;
            border:1px solid rgba(56,189,248,.28);
            border-radius:14px;
            background:rgba(3,9,22,.96);
            backdrop-filter:blur(14px);
            box-shadow:
                0 18px 50px rgba(0,0,0,.45),
                0 0 25px rgba(34,211,238,.08);
            color:#eef4ff;
            font-family:inherit;
        `;

        container.appendChild(
            panel
        );
    }

    const normalizedType =
        type
            .replace(/_/g, " ")
            .trim();

    let rows = "";

    Object.entries(
        properties
    ).forEach(
        ([key, value]) => {

            let displayValue =
                value;

            if (
                value === null ||
                value === undefined
            ) {
                displayValue = "—";
            }

            if (
                typeof value === "object"
            ) {
                try {
                    displayValue =
                        JSON.stringify(
                            value,
                            null,
                            2
                        );
                } catch {
                    displayValue =
                        String(value);
                }
            }

            rows += `
                <div style="
                    display:grid;
                    grid-template-columns:110px 1fr;
                    gap:10px;
                    padding:9px 0;
                    border-bottom:
                        1px solid
                        rgba(100,116,139,.15);
                ">

                    <div style="
                        color:#71819a;
                        font-size:11px;
                        font-weight:700;
                        text-transform:uppercase;
                        letter-spacing:.05em;
                        overflow-wrap:anywhere;
                    ">
                        ${escapeHTML(key)}
                    </div>

                    <div style="
                        color:#dce7f7;
                        font-size:12px;
                        line-height:1.5;
                        overflow-wrap:anywhere;
                        white-space:pre-wrap;
                    ">
                        ${escapeHTML(
                            String(displayValue)
                        )}
                    </div>

                </div>
            `;
        }
    );

    if (!rows) {

        rows = `
            <div style="
                color:#71819a;
                font-size:12px;
                padding:12px 0;
            ">
                No additional properties available.
            </div>
        `;
    }

    let typeClass =
        normalizedType
            .toLowerCase();

    let accent =
        "#22d3ee";

    if (
        typeClass.includes("fraud") ||
        typeClass.includes("alert")
    ) {
        accent =
            "#ef4444";
    } else if (
        typeClass.includes("account")
    ) {
        accent =
            "#818cf8";
    } else if (
        typeClass.includes("merchant")
    ) {
        accent =
            "#a78bfa";
    } else if (
        typeClass.includes("card")
    ) {
        accent =
            "#f59e0b";
    } else if (
        typeClass.includes("location")
    ) {
        accent =
            "#22c55e";
    }

    panel.innerHTML = `

        <div style="
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            gap:14px;
            margin-bottom:16px;
        ">

            <div style="
                min-width:0;
            ">

                <div style="
                    color:${accent};
                    font-size:10px;
                    font-weight:800;
                    text-transform:uppercase;
                    letter-spacing:.14em;
                    margin-bottom:7px;
                ">
                    ${escapeHTML(
                        normalizedType
                    )}
                </div>

                <div style="
                    color:#f5f8ff;
                    font-size:17px;
                    font-weight:750;
                    line-height:1.3;
                    overflow-wrap:anywhere;
                ">
                    ${escapeHTML(label)}
                </div>

            </div>

            <button
                type="button"
                class="kg-details-close"
                aria-label="Close"
                style="
                    flex:0 0 auto;
                    width:30px;
                    height:30px;
                    border:0;
                    border-radius:8px;
                    background:
                        rgba(100,116,139,.14);
                    color:#94a3b8;
                    cursor:pointer;
                    font-size:18px;
                    line-height:30px;
                "
            >
                ×
            </button>

        </div>

        <div style="
            height:2px;
            margin-bottom:4px;
            background:${accent};
            opacity:.7;
            border-radius:4px;
        "></div>

        ${rows}
    `;

    panel
        .querySelector(
            ".kg-details-close"
        )
        ?.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                panel.remove();
            }
        );
}

    /* ============================================================
       ESCAPE HTML
       ============================================================ */

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* ============================================================
       SEARCH
       ============================================================ */

    function setupSearch() {

        const input =
            getSearchInput();


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                currentSearch =
                    input.value || "";

                refreshGraphView();
            }
        );
    }


    /* ============================================================
       TYPE FILTER
       ============================================================ */

    function setupTypeFilter() {

        const select =
            getTypeSelect();


        if (!select) {
            return;
        }


        select.addEventListener(
            "change",
            () => {

                currentType =
                    select.value ||
                    "all";

                refreshGraphView();
            }
        );
    }


    /* ============================================================
       REFRESH BUTTON
       ============================================================ */

    function setupRefreshButton() {

        const button =
            getRefreshButton();


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                button.disabled =
                    true;

                try {

                    await loadAndRender();

                } finally {

                    button.disabled =
                        false;
                }
            }
        );
    }


    /* ============================================================
       RESET BUTTON
       ============================================================ */

    function setupResetButton() {

        const button =
            getResetButton();


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                currentSearch = "";
                currentType = "all";


                const search =
                    getSearchInput();

                if (search) {
                    search.value = "";
                }


                const select =
                    getTypeSelect();

                if (select) {
                    select.value = "all";
                }


                refreshGraphView();
            }
        );
    }


    /* ============================================================
       REFRESH GRAPH VIEW
       ============================================================ */

    function refreshGraphView() {

        const container =
            getGraphContainer();


        if (!container) {
            return;
        }


        renderGraph(
            container
        );
    }


    /* ============================================================
       LEGEND
       ============================================================ */

    function createLegend(container) {

        /*
         * HTML already contains the legend.
         * Do not create another one.
         */

        if (
            container.parentElement &&
            container.parentElement
                .querySelector(
                    ".kg-legend"
                )
        ) {
            return;
        }


        if (
            container.querySelector(
                ".fg-graph-legend"
            )
        ) {
            return;
        }


        const legend =
            document.createElement(
                "div"
            );


        legend.className =
            "fg-graph-legend";


        const items = [
            [
                "Transaction",
                "#22d3ee"
            ],
            [
                "Account",
                "#818cf8"
            ],
            [
                "Merchant",
                "#a78bfa"
            ],
            [
                "Device",
                "#22c55e"
            ],
            [
                "Card",
                "#f59e0b"
            ],
            [
                "Fraud Alert",
                "#ef4444"
            ],
            [
                "User",
                "#38bdf8"
            ]
        ];


        legend.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                gap:18px;
                flex-wrap:wrap;
                padding:12px 18px;
                background:#030916;
                border-top:
                    1px solid
                    rgba(39,57,84,.75);
                color:#8290a6;
                font-size:11px;
            ">

                <span style="
                    color:#6f7f98;
                    font-size:10px;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:.12em;
                ">
                    Entity Types
                </span>

                ${items
                    .map(
                        ([name, color]) => `
                            <span style="
                                display:inline-flex;
                                align-items:center;
                                gap:7px;
                            ">
                                <span style="
                                    width:8px;
                                    height:8px;
                                    border-radius:50%;
                                    background:${color};
                                    box-shadow:
                                        0 0 8px ${color};
                                "></span>

                                ${escapeHTML(name)}
                            </span>
                        `
                    )
                    .join("")}

            </div>
        `;


        container.appendChild(
            legend
        );
    }


    /* ============================================================
       RESIZE
       ============================================================ */

    function setupResize() {

        window.addEventListener(
            "resize",
            () => {

                clearTimeout(
                    resizeTimer
                );


                resizeTimer =
                    setTimeout(
                        () => {

                            const container =
                                getGraphContainer();


                            if (
                                !container ||
                                !svg
                            ) {
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


                            if (
                                simulation
                            ) {

                                simulation
                                    .force(
                                        "center",
                                        window.d3
                                            .forceCenter(
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
                                            .strength(
                                                0.035
                                            )
                                    )
                                    .force(
                                        "y",
                                        window.d3
                                            .forceY(
                                                height / 2
                                            )
                                            .strength(
                                                0.035
                                            )
                                    )
                                    .alpha(
                                        0.35
                                    )
                                    .restart();
                            }

                        },
                        180
                    );
            }
        );
    }


    /* ============================================================
       LOAD + RENDER
       ============================================================ */

    async function loadAndRender() {

        const container =
            getGraphContainer();


        if (!container) {

            console.error(
                "KNOWLEDGE GRAPH: Graph container not found."
            );

            return;
        }


        removeInitializingOverlay();


        container.classList.add(
            "fg-graph-host"
        );


        const data =
            await fetchGraph();
        console.log("========== GRAPH DEBUG ==========");
console.log("RAW DATA:", data);
console.log("TOTAL NODES:", data?.nodes?.length);
console.log("TOTAL RELATIONSHIPS:", data?.relationships?.length);

console.table(
    (data?.nodes || []).map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        transaction_id: n.properties?.transaction_id
    }))
);

console.log("TRANSACTIONS:",
    (data?.nodes || []).filter(n =>
        String(
            n.type ||
            n.label ||
            n.labels?.[0] ||
            ""
        ).toLowerCase().includes("transaction")
    )
);

console.log("==============================");

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
         * IMPORTANT FIX:
         *
         * Previously prepareData(data) was called
         * but its returned data was discarded.
         *
         * Now currentData receives the prepared data.
         */

        currentData = prepareData(data);


        console.log(
            `KNOWLEDGE GRAPH: Prepared ${currentData.nodes.length} nodes and ${currentData.relationships.length} relationships`
        );


        renderGraph(
            container
        );


        createLegend(
            container
        );


        removeInitializingOverlay();
    }


    /* ============================================================
       INITIALIZE
       ============================================================ */

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


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.FinGuardKnowledgeGraph = {

        reload:
            loadAndRender,

        reset:
            resetGraphView,

        refresh:
            refreshGraphView,

        getData:
            () => currentData
    };


    /* ============================================================
       START
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeKnowledgeGraph,
            {
                once: true
            }
        );

    } else {

        initializeKnowledgeGraph();
    }

})();
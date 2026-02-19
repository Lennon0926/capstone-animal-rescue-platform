from graphviz import Digraph

def build_flowchart(output_name="capstone_app_flowchart"):
    g = Digraph("CapstoneAppFlow", format="png")
    g.attr(rankdir="LR", splines="spline", nodesep="0.6", ranksep="1.0", pad="0.5")
    g.attr(bgcolor="#FAFAFA")
    g.attr("node", shape="box", style="rounded,filled", color="#E0E0E0", fillcolor="#FFFFFF",
           fontname="Helvetica Neue", fontsize="11", penwidth="1.5", margin="0.15,0.1")
    g.attr("edge", color="#9E9E9E", arrowsize="0.7", fontname="Helvetica Neue", fontsize="9",
           fontcolor="#666666", penwidth="1.2")

    # Color palette - soft, modern tones
    USER_COLOR = "#E3F2FD"       # Light blue
    USER_BORDER = "#1976D2"
    FRONTEND_COLOR = "#E8F5E9"   # Light green
    FRONTEND_BORDER = "#388E3C"
    API_COLOR = "#FFF3E0"        # Light orange
    API_BORDER = "#F57C00"
    DB_COLOR = "#F3E5F5"         # Light purple
    DB_BORDER = "#7B1FA2"
    STORAGE_COLOR = "#ECEFF1"    # Light gray
    STORAGE_BORDER = "#546E7A"
    NOTIFY_COLOR = "#FCE4EC"     # Light pink
    NOTIFY_BORDER = "#C2185B"
    FLOW_COLOR = "#FFFDE7"       # Light yellow
    FLOW_BORDER = "#FBC02D"

    # ----------------------------
    # USERS
    # ----------------------------
    with g.subgraph(name="cluster_users") as c:
        c.attr(label="  Users  ", style="rounded,filled", color=USER_BORDER, fillcolor=USER_COLOR,
               fontname="Helvetica Neue Bold", fontsize="12", penwidth="2")
        c.node("U_Public", "Public Visitor\n(adopter / donor)", fillcolor="#BBDEFB")
        c.node("U_Admin", "Admin / Staff", fillcolor="#BBDEFB")

    # ----------------------------
    # FRONTEND (Vercel)
    # ----------------------------
    with g.subgraph(name="cluster_frontend") as c:
        c.attr(label="  Frontend (Vercel)  ", style="rounded,filled", color=FRONTEND_BORDER, 
               fillcolor=FRONTEND_COLOR, fontname="Helvetica Neue Bold", fontsize="12", penwidth="2")
        c.node("FE_Web", "Web App\n(Next.js / React)", fillcolor="#C8E6C9")
        c.node("FE_Pages", "Core Pages\n• Landing Pages\n• Blog\n• About Us\n• Services\n• Donations", fillcolor="#C8E6C9")
        c.node("FE_Admin", "Admin Dashboard\n• Manage Animals\n• Content Updates", fillcolor="#C8E6C9")

        c.edge("FE_Web", "FE_Pages")
        c.edge("FE_Web", "FE_Admin")

    # ----------------------------
    # AUTH + API LAYER
    # ----------------------------
    with g.subgraph(name="cluster_api") as c:
        c.attr(label="  Auth + API Layer  ", style="rounded,filled", color=API_BORDER,
               fillcolor=API_COLOR, fontname="Helvetica Neue Bold", fontsize="12", penwidth="2")
        c.node("AUTH", "Authentication\n(Supabase Auth)", fillcolor="#FFE0B2")
        c.node("API", "API Routes\n(Vercel Functions)", fillcolor="#FFE0B2")
        c.node("VALID", "Validation\n", fillcolor="#FFE0B2")

        c.edge("AUTH", "API")
        c.edge("API", "VALID")

    # ----------------------------
    # SUPABASE (DB + STORAGE)
    # ----------------------------
    with g.subgraph(name="cluster_supabase") as c:
        c.attr(label="  Backend (Supabase)  ", style="rounded,filled", color=DB_BORDER,
               fillcolor=DB_COLOR, fontname="Helvetica Neue Bold", fontsize="12", penwidth="2")
        c.node("DB", "Postgres Database\n• animals\n• applications\n• users/roles", fillcolor="#E1BEE7")


    # ----------------------------
    # OPTIONAL IMAGE STORAGE (Cloudflare R2)
    # ----------------------------
    with g.subgraph(name="cluster_storage") as c:
        c.attr(label="  CDN Layer  ", style="rounded,filled", color=STORAGE_BORDER,
               fillcolor=STORAGE_COLOR, fontname="Helvetica Neue Bold", fontsize="12", penwidth="2")
        c.node("R2", "Cloudflare R2", fillcolor="#CFD8DC")
        c.node("CDN", "CDN Delivery", fillcolor="#CFD8DC")

        c.edge("R2", "CDN")

    # ----------------------------
    # NOTIFICATIONS / INTEGRATIONS
    # ----------------------------
    with g.subgraph(name="cluster_notify") as c:
        c.attr(label="  Integrations  ", style="rounded,filled", color=NOTIFY_BORDER,
               fillcolor=NOTIFY_COLOR, fontname="Helvetica Neue Bold", fontsize="12", penwidth="2")
        c.node("PAY", "Payments\n", fillcolor="#F8BBD9")
        c.node("LOG", "Logging\n(Vercel)", fillcolor="#F8BBD9")

    # ----------------------------
    # MAIN FLOWS: USER -> WEB
    # ----------------------------
    g.edge("U_Public", "FE_Web")
    g.edge("U_Admin", "FE_Web")

    # ----------------------------
    # FRONTEND -> AUTH/API -> DB
    # ----------------------------
    g.edge("FE_Pages", "AUTH")
    g.edge("FE_Pages", "API")
    g.edge("FE_Admin", "AUTH")
    g.edge("FE_Admin", "API")

    g.edge("VALID", "DB")

    # ----------------------------
    # ADOPTION APPLICATION FLOW
    # ----------------------------
    g.node("ADOPT", "Adoption\nApplication", fillcolor=FLOW_COLOR, color=FLOW_BORDER, penwidth="2")
    g.node("REVIEW", "Admin\nReview", fillcolor=FLOW_COLOR, color=FLOW_BORDER, penwidth="2")

    g.edge("FE_Pages", "ADOPT")
    g.edge("ADOPT", "API")
    g.edge("API", "DB")
    g.edge("DB", "REVIEW")
    g.edge("REVIEW", "API")
    g.edge("API", "EMAIL")

    # ----------------------------
    # DONATION FLOW
    # ----------------------------
    g.node("DONATE", "Donation\nFlow", fillcolor=FLOW_COLOR, color=FLOW_BORDER, penwidth="2")
    g.edge("FE_Pages", "DONATE")
    g.edge("DONATE", "PAY")
    g.edge("PAY", "API")

    # ----------------------------
    # IMAGE FLOW
    # ----------------------------
    g.node("IMG_UPLOAD", "Image\nUpload", fillcolor=FLOW_COLOR, color=FLOW_BORDER, penwidth="2")
    g.edge("FE_Admin", "IMG_UPLOAD")
    g.edge("IMG_UPLOAD", "API")

    # Storage connections
    g.edge("API", "SB_Storage")
    g.edge("SB_Storage", "FE_Pages")
    g.edge("API", "R2", style="dashed")
    g.edge("CDN", "FE_Pages", style="dashed")

    # ----------------------------
    # OBSERVABILITY
    # ----------------------------
    g.edge("FE_Web", "LOG", style="dotted")
    g.edge("API", "LOG", style="dotted")
    g.edge("DB", "LOG", style="dotted")

    # Render PNG, SVG, and PDF for multiple format support
    g.render(output_name, cleanup=True)  # creates output_name.png
    g.format = "svg"
    g.render(output_name, cleanup=True)  # creates output_name.svg
    g.format = "pdf"
    g.render(output_name, cleanup=True)  # creates output_name.pdf

    print(f"Generated: {output_name}.png, {output_name}.svg, and {output_name}.pdf")

if __name__ == "__main__":
    build_flowchart("capstone_app_flowchart")
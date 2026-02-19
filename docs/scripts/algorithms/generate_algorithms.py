#!/usr/bin/env python3
"""
Key Algorithms Flowchart Generator
Generates flowcharts documenting core algorithmic processes for the Animal Rescue Platform

Based on: "Design and Implementation of a Serverless Full-Stack Platform 
           for Animal Rescue Non-Profit Operations"

Key Algorithms Documented:
1. Adoption Application Workflow - Form submission through admin review to decision
2. Animal Search & Filter - Query building, execution, pagination
3. Admin Animal Listing Creation - Adding animals with photos and medical info
4. Donation Redirect Flow - External payment page integration (PayPal/ATH Móvil)
"""

from graphviz import Digraph
import os


def create_algorithms_flowchart():
    g = Digraph("KeyAlgorithms", format="png")
    g.attr(rankdir="TB", splines="spline", nodesep="0.4", ranksep="0.5", pad="0.4")
    g.attr(bgcolor="#FAFAFA")
    
    # Default node styling
    g.attr("node", fontname="Helvetica Neue", fontsize="9", penwidth="1.5", margin="0.1,0.06")
    g.attr("edge", color="#9E9E9E", arrowsize="0.6", fontname="Helvetica Neue", fontsize="8",
           fontcolor="#666666", penwidth="1.0")

    # Color palette
    START_END = "#4CAF50"       # Green - start/end
    DECISION = "#FF9800"        # Orange - decision
    EXTERNAL = "#607D8B"        # Blue-gray - external service

    # ============================================================
    # ALGORITHM 1: ADOPTION APPLICATION WORKFLOW
    # Per report: "structured digital workflows that streamline adoption"
    # "99% of submitted adoption shall be correctly stored"
    # "Application submissions processed within 2 seconds under 50 concurrent users"
    # ============================================================
    with g.subgraph(name="cluster_adoption") as c:
        c.attr(label="  1. Adoption Application Workflow  ", style="rounded,filled", 
               color="#1976D2", fillcolor="#FFFFFF", fontname="Helvetica Neue Bold", 
               fontsize="11", penwidth="2")
        
        c.node("A_START", "Start", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        c.node("A_SUBMIT", "User submits\nadoption form", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("A_VALIDATE", "API validates\ninput data", shape="box", style="rounded,filled", fillcolor="#BBDEFB")
        c.node("A_VALID?", "Valid?", shape="diamond", style="filled", fillcolor=DECISION, fontcolor="white")
        c.node("A_ERROR", "Return validation\nerror (400)", shape="box", style="rounded,filled", fillcolor="#FFCDD2")
        c.node("A_STORE", "Store in PostgreSQL\n(applications table)", shape="box", style="rounded,filled", fillcolor="#BBDEFB")
        c.node("A_FK", "Link to animal\n(aid FK)", shape="box", style="rounded,filled", fillcolor="#BBDEFB")
        c.node("A_NOTIFY", "Queue admin\nnotification", shape="box", style="rounded,filled", fillcolor="#BBDEFB")
        c.node("A_CONFIRM", "Return success\nconfirmation", shape="parallelogram", style="filled", fillcolor="#C8E6C9")
        c.node("A_REVIEW", "Admin reviews\nin dashboard", shape="box", style="rounded,filled", fillcolor="#BBDEFB")
        c.node("A_EMAIL", "Send email\nto applicant", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("A_END", "End", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        
        c.edge("A_START", "A_SUBMIT")
        c.edge("A_SUBMIT", "A_VALIDATE")
        c.edge("A_VALIDATE", "A_VALID?")
        c.edge("A_VALID?", "A_STORE", label="Yes")
        c.edge("A_VALID?", "A_ERROR", label="No")
        c.edge("A_ERROR", "A_END")
        c.edge("A_STORE", "A_FK")
        c.edge("A_FK", "A_NOTIFY")
        c.edge("A_NOTIFY", "A_CONFIRM")
        c.edge("A_CONFIRM", "A_REVIEW")
        c.edge("A_REVIEW", "A_EMAIL")
        c.edge("A_EMAIL", "A_END")

    # ============================================================
    # ALGORITHM 2: ANIMAL SEARCH & FILTER
    # Per report: "search and filter adoptable animals based on attributes 
    # such as species, age, and size with response times below 1.5 seconds"
    # ============================================================
    with g.subgraph(name="cluster_search") as c:
        c.attr(label="  2. Animal Search & Filter Algorithm  ", style="rounded,filled", 
               color="#388E3C", fillcolor="#FFFFFF", fontname="Helvetica Neue Bold", 
               fontsize="11", penwidth="2")
        
        c.node("S_START", "Start", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        c.node("S_INPUT", "User selects\nfilter criteria", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("S_PARSE", "Parse & sanitize\nquery params", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("S_BUILD", "Build parameterized\nSQL query", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("S_FILTERS", "Apply filters:\nspecies, age, size,\ngender, status", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("S_EXECUTE", "Execute via\nSupabase client", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("S_RESULTS?", "Results > 0?", shape="diamond", style="filled", fillcolor=DECISION, fontcolor="white")
        c.node("S_SORT", "Sort results\n(date/relevance)", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("S_PAGINATE", "Apply pagination\n(limit/offset)", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("S_RETURN", "Return JSON\nresponse", shape="parallelogram", style="filled", fillcolor="#C8E6C9")
        c.node("S_EMPTY", "Return empty\narray + message", shape="box", style="rounded,filled", fillcolor="#FFF9C4")
        c.node("S_RENDER", "Render card\ngrid in UI", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("S_END", "End", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        
        c.edge("S_START", "S_INPUT")
        c.edge("S_INPUT", "S_PARSE")
        c.edge("S_PARSE", "S_BUILD")
        c.edge("S_BUILD", "S_FILTERS")
        c.edge("S_FILTERS", "S_EXECUTE")
        c.edge("S_EXECUTE", "S_RESULTS?")
        c.edge("S_RESULTS?", "S_SORT", label="Yes")
        c.edge("S_RESULTS?", "S_EMPTY", label="No")
        c.edge("S_SORT", "S_PAGINATE")
        c.edge("S_PAGINATE", "S_RETURN")
        c.edge("S_EMPTY", "S_RETURN")
        c.edge("S_RETURN", "S_RENDER")
        c.edge("S_RENDER", "S_END")

    # ============================================================
    # ALGORITHM 3: ADMIN ANIMAL LISTING CREATION
    # Per report: "Publish and manage adoptable animal listings using structured data models"
    # "creation, modification, and deletion of animal listings"
    # "designed for non-technical users"
    # ============================================================
    with g.subgraph(name="cluster_animal") as c:
        c.attr(label="  3. Admin Animal Listing Creation  ", style="rounded,filled", 
               color="#7B1FA2", fillcolor="#FFFFFF", fontname="Helvetica Neue Bold", 
               fontsize="11", penwidth="2")
        
        c.node("AN_START", "Admin opens\ndashboard", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        c.node("AN_AUTH", "Verify admin\nsession (JWT)", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_AUTH?", "Authorized?", shape="diamond", style="filled", fillcolor=DECISION, fontcolor="white")
        c.node("AN_DENY", "Redirect to\nlogin (401)", shape="box", style="rounded,filled", fillcolor="#FFCDD2")
        c.node("AN_NAV", "Navigate to\nAnimals section", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_NEW", "Click 'Add\nNew Animal'", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("AN_FORM", "Display animal\nentry form", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_INPUT", "Enter: name, species,\nage, size, gender,\ndescription", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("AN_PHOTO", "Upload animal\nphoto(s)", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("AN_STORAGE", "Store in\nCloudflare R2 Storage", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_URL", "Get public\nimage URL", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_STATUS", "Set status:\nAvailable", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("AN_SUBMIT", "Submit animal\ndata", shape="parallelogram", style="filled", fillcolor="#E1BEE7")
        c.node("AN_VALIDATE", "API validates\nrequired fields", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_VALID?", "Valid?", shape="diamond", style="filled", fillcolor=DECISION, fontcolor="white")
        c.node("AN_ERROR", "Show validation\nerrors", shape="box", style="rounded,filled", fillcolor="#FFCDD2")
        c.node("AN_INSERT", "INSERT into\nanimals table", shape="box", style="rounded,filled", fillcolor="#E1BEE7")
        c.node("AN_SUCCESS", "Show success\nmessage", shape="parallelogram", style="filled", fillcolor="#C8E6C9")
        c.node("AN_LIST", "Animal appears\nin public catalog", shape="box", style="rounded,filled", fillcolor="#C8E6C9")
        c.node("AN_END", "End", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        
        c.edge("AN_START", "AN_AUTH")
        c.edge("AN_AUTH", "AN_AUTH?")
        c.edge("AN_AUTH?", "AN_NAV", label="Yes")
        c.edge("AN_AUTH?", "AN_DENY", label="No")
        c.edge("AN_DENY", "AN_END")
        c.edge("AN_NAV", "AN_NEW")
        c.edge("AN_NEW", "AN_FORM")
        c.edge("AN_FORM", "AN_INPUT")
        c.edge("AN_INPUT", "AN_PHOTO")
        c.edge("AN_PHOTO", "AN_STORAGE")
        c.edge("AN_STORAGE", "AN_URL")
        c.edge("AN_URL", "AN_STATUS")
        c.edge("AN_STATUS", "AN_SUBMIT")
        c.edge("AN_SUBMIT", "AN_VALIDATE")
        c.edge("AN_VALIDATE", "AN_VALID?")
        c.edge("AN_VALID?", "AN_INSERT", label="Yes")
        c.edge("AN_VALID?", "AN_ERROR", label="No")
        c.edge("AN_ERROR", "AN_INPUT")
        c.edge("AN_INSERT", "AN_SUCCESS")
        c.edge("AN_SUCCESS", "AN_LIST")
        c.edge("AN_LIST", "AN_END")


    # ============================================================
    # ALGORITHM 4: DONATION REDIRECT FLOW
    # Per report: "Online donations are securely processed through trusted 
    # third-party payment service providers"
    # "The platform does not process financial transactions internally"
    # "Users are redirected to a third-party provider"
    # ============================================================
    with g.subgraph(name="cluster_donation") as c:
        c.attr(label="  4. Donation Redirect Flow (External)  ", style="rounded,filled", 
               color="#C2185B", fillcolor="#FFFFFF", fontname="Helvetica Neue Bold", 
               fontsize="11", penwidth="2")
        
        c.node("D_START", "User clicks\nDonate", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        c.node("D_SELECT", "User selects\ndonation option", shape="parallelogram", style="filled", fillcolor="#F8BBD9")
        c.node("D_REDIRECT", "Redirect to\nexternal provider", shape="box", style="rounded,filled", fillcolor="#F8BBD9")
        c.node("D_EXTERNAL", "External Payment\n(PayPal/ATH Móvil)", shape="box", style="filled", fillcolor=EXTERNAL, fontcolor="white")
        c.node("D_PROCESS", "Provider processes\ntransaction", shape="box", style="filled", fillcolor=EXTERNAL, fontcolor="white")
        c.node("D_COMPLETE?", "Payment\ncomplete?", shape="diamond", style="filled", fillcolor=DECISION, fontcolor="white")
        c.node("D_CONFIRM", "Provider shows\nconfirmation", shape="box", style="filled", fillcolor=EXTERNAL, fontcolor="white")
        c.node("D_CANCEL", "User returns\nto site", shape="box", style="rounded,filled", fillcolor="#FFF9C4")
        c.node("D_THANKS", "Display thank\nyou message", shape="parallelogram", style="filled", fillcolor="#C8E6C9")
        c.node("D_END", "End", shape="ellipse", style="filled", fillcolor=START_END, fontcolor="white")
        
        c.edge("D_START", "D_SELECT")
        c.edge("D_SELECT", "D_REDIRECT")
        c.edge("D_REDIRECT", "D_EXTERNAL")
        c.edge("D_EXTERNAL", "D_PROCESS")
        c.edge("D_PROCESS", "D_COMPLETE?")
        c.edge("D_COMPLETE?", "D_CONFIRM", label="Yes")
        c.edge("D_COMPLETE?", "D_CANCEL", label="No")
        c.edge("D_CONFIRM", "D_THANKS")
        c.edge("D_CANCEL", "D_END")
        c.edge("D_THANKS", "D_END")


    # -------------------------------
    # SAVE
    # -------------------------------
    current_dir = os.path.dirname(os.path.abspath(__file__))

    g.render(os.path.join(current_dir, "key_algorithms_flowchart"), cleanup=True)
    g.format = "svg"
    g.render(os.path.join(current_dir, "key_algorithms_flowchart"), cleanup=True)
    g.format = "pdf"
    g.render(os.path.join(current_dir, "key_algorithms_flowchart"), cleanup=True)

    print("Key algorithms flowchart generated successfully:")
    print("  - key_algorithms_flowchart.png")
    print("  - key_algorithms_flowchart.svg")
    print("  - key_algorithms_flowchart.pdf")


if __name__ == "__main__":
    create_algorithms_flowchart()

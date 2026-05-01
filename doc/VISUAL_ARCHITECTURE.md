# Visual Architecture: Paperclip Agent Communications

This document contains detailed visualizations of the current and proposed Paperclip communication architectures, designed to support the migration towards a "Linear + Slack combined interface".

---

## 1. Current State: Issue-Centric Data Model

Currently, all communication is strictly bound to an `Issue` (Task). There is no concept of a standalone chat.

```mermaid
erDiagram
    Issue {
        string id PK
        string title
        string status
        string description
    }
    IssueComment {
        string id PK
        string issueId FK
        string authorId
        string body
        datetime createdAt
    }
    IssueThreadInteraction {
        string id PK
        string issueId FK
        string type "e.g., AskUserQuestion"
        json state
    }
    AgentRun {
        string id PK
        string issueId FK
        string agentId
        string status
    }

    Issue ||--o{ IssueComment : "contains"
    Issue ||--o{ IssueThreadInteraction : "contains"
    Issue ||--o{ AgentRun : "orchestrates"
```

---

## 2. Proposed State: Channel & Issue (Slack + Linear) Data Model

To achieve a combined interface, communication (Chat/Channels) must be decoupled from Tasks (Issues), while allowing them to reference each other fluidly.

```mermaid
erDiagram
    Channel {
        string id PK
        string name "e.g., #general, @agent-name"
        string type "Direct, Group, Issue-Linked"
    }
    Message {
        string id PK
        string channelId FK
        string authorId
        string body
        datetime createdAt
    }
    Issue {
        string id PK
        string title "The Linear Task"
        string status
        string linkedChannelId FK "Optional chat thread"
    }
    AgentRun {
        string id PK
        string contextId FK "Can run on a Channel OR an Issue"
    }

    Channel ||--o{ Message : "contains"
    Channel ||--o| Issue : "can be linked to"
    Channel ||--o{ AgentRun : "can orchestrate"
    Issue ||--o{ AgentRun : "can orchestrate"
```

---

## 3. Current State: Communication Sequence (Polling / REST)

Agents currently communicate by polling for work and posting updates back to the REST API.

```mermaid
sequenceDiagram
    actor Human
    participant UI as IssueDetail (UI)
    participant API as Server API
    participant DB as Database
    participant HB as Heartbeat Service
    participant Agent as Agent (Adapter)

    Human->>UI: Types comment in IssueChat
    UI->>API: POST /api/issues/{id}/comments
    API->>DB: Save Comment
    API-->>UI: 200 OK

    HB->>DB: Check for queued runs/updates
    DB-->>HB: New comment on Issue
    HB->>Agent: invoke(issueContext)
    
    Note over Agent: Agent does work...
    
    Agent->>API: POST /api/issues/{id}/comments
    API->>DB: Save Agent Comment
    
    Note over UI: UI must poll or refresh to see Agent's comment
    UI->>API: GET /api/issues/{id}/comments
    API-->>UI: Returns updated comments
```

---

## 4. Proposed State: Communication Sequence (Real-time / WebSocket)

To achieve a "Slack-like" feel, real-time bidirectional communication is required for both humans and agents.

```mermaid
sequenceDiagram
    actor Human
    participant UI as Client App
    participant WS as WebSocket/SSE Gateway
    participant API as Server API
    participant AgentRouter as Agent Router
    participant Agent as Agent (Adapter)

    Human->>UI: Sends Message in Channel
    UI->>WS: Publish Message Event
    WS->>API: Persist Message
    API->>WS: Broadcast: NewMessage(Channel ID)
    
    WS-->>UI: Real-time UI Update (Slack feel)
    WS-->>AgentRouter: Event: NewMessage
    
    AgentRouter->>Agent: dispatchEvent(MessageContext)
    
    Note over Agent: Agent streams response...
    
    Agent->>WS: Stream Reply Event
    WS-->>UI: Real-time UI Update (Agent is typing...)
    
    Agent->>API: Finalize Message State
    API->>WS: Broadcast: MessageComplete
    WS-->>UI: Render final message & Linear state update
```

---

## 5. Proposed UI Architecture (The "Combined" Interface)

A high-level component tree for the target user interface.

```mermaid
graph TD
    App["Main Layout"]
    
    App --> Sidebar["Sidebar"]
    Sidebar --> Channels["Channels List (Slack)"]
    Sidebar --> Issues["Issues List (Linear)"]
    Sidebar --> DMs["Direct Messages (Agent/Human)"]
    
    App --> MainView["Context View"]
    
    MainView --> SplitView{"Split View"}
    
    SplitView --> ChatPane["Chat/Thread Pane"]
    ChatPane --> MessageList["Real-time Message Stream"]
    ChatPane --> Composer["Unified Composer"]
    
    SplitView --> ContextPane["Context/Task Pane"]
    ContextPane --> TaskProperties["Issue Status, Assignee, Labels"]
    ContextPane --> Artifacts["Generated Code/Docs"]
```

# Workflow Runner

A desktop app that lets you visually create workflows of npm scripts across multiple projects using a drag-and-drop canvas.

![Electron](https://img.shields.io/badge/Electron-41-blue) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![React Flow](https://img.shields.io/badge/React%20Flow-12-purple)

## Features

- **Folder Scanner** - Select a root folder and auto-discover all projects with `package.json`
- **Drag & Drop Canvas** - Drag projects onto a React Flow canvas or click to add
- **Script Selection** - Check which npm scripts to run per project node
- **Workflow Execution** - Connected nodes run sequentially (topological order), unconnected nodes run in parallel
- **Per-Node Controls** - Play/Stop individual nodes independently
- **Port Detection** - Auto-detects when a dev server starts listening on a port and shows a toast notification
- **Process Cleanup** - Stop button kills entire process trees and cleans up ports (`lsof`-based)
- **ANSI Colors** - Console output renders terminal colors (bold, red, green, etc.)
- **Resizable Panels** - Drag to resize sidebar width, sidebar sections split, console height, and individual nodes
- **Workflow Persistence** - Workflows saved as JSON in `~/.workflow-runner/`
- **Cycle Detection** - Warns if edges form a cycle before running

## Tech Stack

- **Electron** + **Electron Forge** + **Vite** - Desktop shell and build tooling
- **React 19** + **TypeScript 5.5** - Renderer
- **React Flow v12** (`@xyflow/react`) - Workflow canvas
- **TailwindCSS 3** - Styling
- **lucide-react** - Icons

## Getting Started

```bash
# Install dependencies
npm install

# Run in development
npm start

# Package for distribution
npm run make
```

## How It Works

1. Click the folder picker and select a directory containing project subfolders
2. Create a new workflow from the sidebar
3. Click or drag projects onto the canvas
4. Check the npm scripts you want to run on each node
5. Connect nodes with edges to define execution order
6. Click **Run** to execute the workflow

### Execution Model

- **Topological sort** (Kahn's algorithm) determines execution stages
- Stage 1: all nodes with no incoming edges run in **parallel**
- Stage 2+: once a stage completes, nodes whose dependencies are satisfied run in **parallel**
- Within a node, selected scripts run **sequentially**
- On failure: the workflow stops

## Project Structure

```
src/
  main/           # Electron main process
    main.ts         Entry point
    ipc-handlers.ts IPC handler registrations
    storage.ts      JSON persistence (~/.workflow-runner/)
    folder-scanner.ts  Scans for package.json projects
    script-executor.ts Spawns npm scripts, streams output
  preload/        # contextBridge IPC exposure
  renderer/       # React app
    components/
      Canvas/       React Flow canvas + ProjectNode
      Sidebar/      Folder picker, project list, workflow list
      Toolbar/      Save, Run, Stop, Console toggle
      Console/      Log output with ANSI color rendering
      Notifications/ Port detection toasts
    hooks/          useProjects, useWorkflows, useExecution, useResizable
    lib/            Topological sort, ANSI parser
    types/          TypeScript interfaces
  shared/         # IPC channel constants
```

## License

MIT

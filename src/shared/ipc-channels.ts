export const IPC = {
  FOLDER_PICK: 'folder:pick',
  FOLDER_SCAN: 'folder:scan',
  FOLDER_GET_ROOTS: 'folder:getRoots',
  FOLDER_ADD_ROOT: 'folder:addRoot',
  FOLDER_REMOVE_ROOT: 'folder:removeRoot',

  WORKFLOW_GET_ALL: 'workflow:getAll',
  WORKFLOW_GET: 'workflow:get',
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_UPDATE: 'workflow:update',
  WORKFLOW_DELETE: 'workflow:delete',
  WORKFLOW_EXPORT: 'workflow:export',
  WORKFLOW_IMPORT: 'workflow:import',

  EXEC_START: 'exec:start',
  EXEC_STOP: 'exec:stop',
  EXEC_RUN_NODE: 'exec:runNode',
  EXEC_LOG: 'exec:log',
  EXEC_NODE_STATUS: 'exec:nodeStatus',
  EXEC_COMPLETE: 'exec:complete',
  EXEC_PORT_DETECTED: 'exec:portDetected',
} as const;

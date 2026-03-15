import { app } from 'electron';
import { createStorage } from '../shared/storage';

export type { Settings, StoredWorkflow } from '../shared/storage';

const storage = createStorage(app.getPath('home'));

export const getSettings = storage.getSettings.bind(storage);
export const saveSettings = storage.saveSettings.bind(storage);
export const getAllWorkflows = storage.getAllWorkflows.bind(storage);
export const getWorkflow = storage.getWorkflow.bind(storage);
export const createWorkflow = storage.createWorkflow.bind(storage);
export const updateWorkflow = storage.updateWorkflow.bind(storage);
export const deleteWorkflow = storage.deleteWorkflow.bind(storage);

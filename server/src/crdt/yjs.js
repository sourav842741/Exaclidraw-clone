import * as Y from 'yjs';
import { setupWSConnection, docs as wsDocs, setPersistence } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storeDir = process.env.YJS_STORE_DIR || path.join(__dirname, '../../../storage/yjs');
fs.mkdirSync(storeDir, { recursive: true });

const persistence = new LeveldbPersistence(storeDir);

export async function initYjsPersistence() {
  try {
    setPersistence({
      bindState: async (docName, ydoc) => {
        const stored = await persistence.getYDoc(docName);
        if (stored) {
          Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(stored));
        }
        ydoc.on('update', (update) => {
          persistence.storeUpdate(docName, update).catch((err) => {
            logger.error(`yjs persist error: ${err.message}`);
          });
        });
      },
      writeState: async (docName, ydoc) => {
        await persistence.storeUpdate(docName, Y.encodeStateAsUpdate(ydoc));
      },
      clearState: async (docName) => {
        await persistence.destroy(docName);
      },
      checkConnection: async (docName) => {
        return !!wsDocs.get(docName);
      },
    });
    logger.info('Yjs persistence initialized (leveldb)');
  } catch (err) {
    logger.error(`Yjs persistence init failed: ${err.message}`);
  }
}

export async function getYDoc(docName) {
  if (wsDocs.has(docName)) return wsDocs.get(docName);
  const ydoc = new Y.Doc();
  wsDocs.set(docName, ydoc);
  const stored = await persistence.getYDoc(docName);
  if (stored) {
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(stored));
  }
  ydoc.on('update', (update) => {
    persistence.storeUpdate(docName, update).catch((err) => logger.error(`yjs persist error: ${err.message}`));
  });
  return ydoc;
}

export function handleYjsConnection(conn, req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const docName = url.pathname.split('/').pop();

  getYDoc(docName).then((doc) => {
    try {
      setupWSConnection(conn, req, { docName, doc, gc: true });
    } catch (err) {
      logger.error(`yjs connection error: ${err.message}`);
      conn.close();
    }
  });
}

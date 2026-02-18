db = db.getSiblingDB('audit');

if (db.getCollectionNames().indexOf('audit_logs') === -1) {
  db.createCollection('audit_logs');
}

db.audit_logs.createIndex({ occurredAt: -1 });
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ resource: 1 });
db.audit_logs.createIndex({ actorId: 1 });

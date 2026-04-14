Designing a permission-aware file tree like Google Drive is a classic "Scale vs. Complexity" problem. We need to handle deep hierarchies where a single permission change at the root can affect millions of children, while ensuring the system remains responsive.

## 1. Core Domain Entities

We'll use a Composite Pattern for the file structure and a Strategy/Policy pattern for permission evaluation.

### Core Classes

```java
enum NodeType { FILE, FOLDER }
enum AccessLevel { VIEWER, EDITOR, OWNER }

class Node {
    String id;
    String name;
    NodeType type;
    String parentId;
    String ownerId;
    String path; // Materialized path for fast subtree queries (e.g., "/root/id1/id2")
    boolean isTrashed;
    long version; // For optimistic locking
}

class User {
    String id;
    String email;
}

class Permission {
    String nodeId;
    String userId;
    AccessLevel level;
}

class ShareLink {
    String id;
    String nodeId;
    String token;
    AccessLevel level;
    Instant expiry;
}
```

---

## 2. Data Structure & Storage Strategy

### Choosing the Tree Representation
For a file system, we have three main choices:
1.  **Adjacency List:** (`parent_id` reference). Fast writes, but expensive recursive queries for permissions.
2.  **Nested Sets:** Great for reads, but moving a folder requires re-indexing the whole tree (O(N) write).
3.  **Materialized Path:** Storing the path as a string (e.g., `a/b/c`).

**Justification:** We'll use **Materialized Path + Adjacency List**. 
* **Adjacency List** handles direct parent-child operations.
* **Materialized Path** allows us to find all descendants for a permission check or a "move to trash" operation using a simple `LIKE 'path/to/folder/%'` query.

### Database Schema (Relational)

| Table | Key Columns |
| :--- | :--- |
| **Nodes** | `id`, `name`, `type`, `parent_id`, `path`, `owner_id`, `is_trashed`, `version` |
| **Permissions** | `node_id`, `user_id`, `access_level` (Index on `user_id`, `node_id`) |
| **ShareLinks** | `id`, `node_id`, `token`, `access_level`, `expiry` |

---



## 3. Permission Inheritance Logic

Permissions in Google Drive are **additive**. If you have `EDITOR` access at a parent level, you retain it for all children unless explicitly upgraded.

### The Resolution Algorithm:
To check if User $U$ has access to Node $N$:
1.  Check for direct permission on $N$.
2.  If not found, fetch all ancestors of $N$ using the `path` column.
3.  Check the `Permissions` table for any entry matching User $U$ and any ancestor ID.
4.  Pick the highest `AccessLevel` found.

**Optimization:** Use a Bloom Filter or a Redis Cache to store `(User, Node)` access tuples to avoid frequent DB joins on deep trees.

---

## 4. API Contracts

### Permissions & Sharing
* `shareNode(nodeId, targetUserId, accessLevel)` -> `200 OK`
* `generateLink(nodeId, accessLevel)` -> `LinkObject`
* `checkAccess(userId, nodeId)` -> `AccessLevel | Forbidden`

### File Operations
* `moveNode(nodeId, newParentId)`:
    * *Error Handling:* Return `400` if `newParentId` is a child of `nodeId` (prevents circularity).
* `trashNode(nodeId)`: 
    * Marks `is_trashed = true` for the node and all descendants using the materialized path.

---

## 5. Handling Concurrency & Consistency

### Concurrency (The "Move" Problem)
If two users move the same folder simultaneously, the tree structure could corrupt.
* **Solution:** **Optimistic Locking.** Every node has a `version`.
    ```sql
    UPDATE Nodes SET parent_id = :newParent, version = version + 1 
    WHERE id = :id AND version = :currentVersion;
    ```
* If the update returns 0 rows, the client must refresh and retry.

### Trade-offs: Latency vs. Consistency
* **Write Latency:** Moving a large folder requires updating the `path` of all descendants. This is $O(M)$ where $M$ is the number of children. We handle this **asynchronously** via a background job, while the UI shows a "Moving..." state.
* **Permission Consistency:** When a parent's permission is revoked, children should ideally reflect this immediately. By checking permissions against the path at runtime, we ensure **strong consistency** for security, sacrificing a bit of read latency.

---

## 6. Key Flows

### Happy Path: Moving a Folder
1.  **Validate:** Check if User has `EDITOR` access on the node and the destination.
2.  **Lock:** Grab the current `version` of the node.
3.  **Update DB:** Update `parent_id` and the `path` prefix.
4.  **Propagate:** Recursively update the `path` string for all children in the background.

### Edge Case: The "Trash" Cascade
When a folder is trashed, we don't want to lose the original state of the children's `is_trashed` flags (some might have been trashed manually before).
* **Strategy:** Add a `trashed_at_ancestor_id` column. When restoring, only nodes where `trashed_at_ancestor_id == restored_node_id` are flipped back to `is_trashed = false`. This prevents accidentally restoring files that were deleted months ago.

### Edge Case: Permission Revocation
If User A is removed from a parent folder, they lose access to everything inside.
* **Failure Case:** User A has an active "Share Link" to a sub-file. 
* **Policy:** Direct share links and explicit permissions on children usually **override** parent revocation in Google Drive's model. Our resolution algorithm handles this by checking the specific node's permissions first.
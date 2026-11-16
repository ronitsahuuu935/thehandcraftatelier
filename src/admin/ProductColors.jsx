import React, { useEffect, useState } from "react";
import { isVideo } from "../data/media.js";

export function groupGallery(gallery = []) {
  const groups = [];
  gallery.forEach((media, index) => {
    if (!media?.src) return;
    const name = String(media.color || "").trim();
    let group = groups.find((group) => group.name === name && !group.unassigned);
    if (!name) group = groups.find((group) => group.unassigned);
    if (!group) {
      group = { id: crypto.randomUUID(), name, unassigned: !name, items: [] };
      groups.push(group);
    }
    group.items.push({ id: crypto.randomUUID(), media, index });
  });
  return groups;
}

function Preview({ item }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!item.file) return;
    const preview = URL.createObjectURL(item.file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [item.file]);
  if (isVideo(item.media))
    return <video src={item.media.src} poster={item.media.poster} controls preload="none" />;
  return <img alt={item.file?.name || "Product photo"} src={item.media?.src || url || undefined} />;
}

export function ProductColors({ groups, setGroups, disabled }) {
  function change(id, update) {
    setGroups((current) => current.map((group) => (group.id === id ? update(group) : group)));
  }
  return (
    <fieldset className="admin-product-colors" disabled={disabled}>
      <legend>Product images and colors</legend>
      {groups.map((group) => (
        <section key={group.id} className="admin-color-card">
          <div className="admin-color-heading">
            <label>
              Color name
              <input
                required
                value={group.name}
                placeholder="e.g. White or Sage green"
                onChange={(event) =>
                  change(group.id, (g) => ({ ...g, name: event.target.value, unassigned: false }))
                }
              />
            </label>
            <button
              type="button"
              className="admin-row-button"
              onClick={() => setGroups((current) => current.filter((g) => g.id !== group.id))}
            >
              Remove color
            </button>
          </div>
          {group.items.length > 0 && (
            <div className="admin-gallery-grid">
              {group.items.map((item, index) => (
                <div key={item.id}>
                  <div className="admin-gallery-item">
                    <Preview item={item} />
                    <button
                      type="button"
                      aria-label={
                        "Remove image " + (index + 1) + " from " + (group.name || "unnamed color")
                      }
                      onClick={() =>
                        change(group.id, (g) => ({
                          ...g,
                          items: g.items.filter((i) => i.id !== item.id),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <label>
            Add images{group.name && " for " + group.name}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const items = Array.from(event.target.files, (file) => ({
                  id: crypto.randomUUID(),
                  file,
                }));
                event.target.value = "";
                change(group.id, (g) => ({ ...g, items: [...g.items, ...items] }));
              }}
            />
          </label>
        </section>
      ))}
      <button
        type="button"
        className="admin-outline-button"
        onClick={() =>
          setGroups((current) => [...current, { id: crypto.randomUUID(), name: "", items: [] }])
        }
      >
        + Add color
      </button>
      {groups.length === 0 && <p>Add a color before uploading product photos.</p>}
    </fieldset>
  );
}

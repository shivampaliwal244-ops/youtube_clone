/* eslint-disable react/prop-types */
import { genres } from "../utils/genrecollection.js";

function CategoryWiseFilter({ selected = "All", onSelect }) {
  return (
    <div className="category-row" aria-label="Video categories">
      {genres.map((genre) => (
        <button
          aria-pressed={selected === genre}
          className={`category-chip ${selected === genre ? "active" : ""}`}
          key={genre}
          onClick={() => onSelect(genre)}
          type="button"
        >
          {genre}
        </button>
      ))}
    </div>
  );
}

export default CategoryWiseFilter;

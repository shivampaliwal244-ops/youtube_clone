function Shimmer() {
  return (
    <div aria-label="Loading videos" className="video-grid" aria-busy="true">
      {Array.from({ length: 12 }, (_, index) => <div className="video-skeleton" key={index} />)}
    </div>
  );
}

export default Shimmer;

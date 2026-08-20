export default function Loading() {
  return (
    <div className="nearleo-route-loader" role="status" aria-label="Nearleo page is loading">
      <div className="nearleo-loader-brand">
        <span className="nearleo-loader-mark" aria-hidden="true">N</span>
        <strong>Nearleo</strong>
        <i className="nearleo-loader-progress" aria-hidden="true" />
      </div>
    </div>
  );
}

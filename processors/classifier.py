from config.segments import SEGMENTS


class JobClassifier:
    """Classify jobs into segments based on title + description keywords."""

    def __init__(self):
        # Build a flat lookup: segment -> set of lowercase keywords
        self._segment_keywords: dict[str, set[str]] = {}
        for segment, kw_sets in SEGMENTS.items():
            all_kw: set[str] = set()
            for key in kw_sets:
                all_kw.update(k.lower() for k in kw_sets[key])
            self._segment_keywords[segment] = all_kw

    def classify(self, job: dict) -> list[str]:
        text = (
            job.get("title", "") + " " + (job.get("description") or "")
        ).lower()

        matched: list[str] = []
        for segment, keywords in self._segment_keywords.items():
            if any(kw in text for kw in keywords):
                matched.append(segment)

        return matched if matched else ["Other"]

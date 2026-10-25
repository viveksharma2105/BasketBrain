#!/usr/bin/env python3
"""
BasketBrain: 02_mrjob_event_counts.py
Hadoop MapReduce job using mrjob to compute:
  1. Total counts by event type (view, addtocart, transaction)
  2. Top most active items
  3. Top most active visitors
Supports local execution (-r inline, -r local) and Hadoop/Dataproc (-r hadoop, -r dataproc).
"""

import csv
from mrjob.job import MRJob
from mrjob.step import MRStep

class MREventCounts(MRJob):

    def steps(self):
        return [
            MRStep(
                mapper=self.mapper_extract,
                combiner=self.combiner_counts,
                reducer=self.reducer_counts
            ),
            MRStep(
                reducer=self.reducer_summary
            )
        ]

    def mapper_extract(self, _, line):
        # Handle CSV row parsing safely
        try:
            row = next(csv.reader([line]))
            if not row or row[0] == 'timestamp' or len(row) < 4:
                return
            timestamp, visitorid, event, itemid = row[0], row[1], row[2], row[3]
            if event in ('view', 'addtocart', 'transaction'):
                yield ('event', event), 1
                yield ('item', itemid), 1
                yield ('visitor', visitorid), 1
        except Exception:
            pass

    def combiner_counts(self, key, counts):
        yield key, sum(counts)

    def reducer_counts(self, key, counts):
        category, entity_id = key
        total = sum(counts)
        # Pass to step 2 grouped by category
        yield category, (entity_id, total)

    def reducer_summary(self, category, entity_counts):
        # In step 2, gather top records per category
        if category == 'event':
            # Full event breakdown
            event_dict = {entity: count for entity, count in entity_counts}
            yield 'EVENT_TYPE_COUNTS', event_dict
        elif category == 'item':
            # Top 10 items
            sorted_items = sorted(entity_counts, key=lambda x: x[1], reverse=True)[:10]
            yield 'TOP_10_ITEMS', [{'itemid': item, 'interactions': count} for item, count in sorted_items]
        elif category == 'visitor':
            # Top 10 visitors
            sorted_visitors = sorted(entity_counts, key=lambda x: x[1], reverse=True)[:10]
            yield 'TOP_10_VISITORS', [{'visitorid': vis, 'interactions': count} for vis, count in sorted_visitors]

if __name__ == '__main__':
    MREventCounts.run()

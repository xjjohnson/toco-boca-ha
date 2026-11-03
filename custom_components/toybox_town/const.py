"""Constants for Toybox Town."""

DOMAIN = "toybox_town"

SERVICE_ADD_POINTS = "add_points"
ATTR_AMOUNT = "amount"
ATTR_CHILD = "child"
ATTR_REASON = "reason"

# Fired after points are added, for automations (say "well done!", flash a light).
# The game reads the points sensor, not this event, so nothing is counted twice.
EVENT_POINTS_ADDED = "toybox_town_points_added"

MAX_POINTS_PER_CALL = 1000

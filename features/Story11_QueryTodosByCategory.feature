Feature: Query TODOs by category
  As a student
  I want to view tasks with a given priority
  So I can focus on what matters

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title     | doneStatus | description |
      | Quiz 1    | false      | ch1         |
      | Read Ch2  | true       | ch2         |
      | Lab prep  | false      | lab         |
    And a category with title "HIGH" exists
    And a category with title "LOW" exists
    And a student assigns priority "HIGH" to the todo with title "Quiz 1"
    And a student assigns priority "LOW" to the todo with title "Lab prep"

  Scenario: Normal - return all todos tagged HIGH
    When the student queries todos for category "HIGH"
    Then the category result contains titles
      | Quiz 1 |

  Scenario: Alternate - category exists but no todos tagged
    When the student queries todos for category "LOW"
    Then the category result contains titles
      | Lab prep |

  Scenario: Error - unknown category
    When the student queries todos for category "NOPE"
    Then the student is notified of a 404 or 400 error

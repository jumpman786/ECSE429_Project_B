Feature: Fetch a TODO by id
  As a student
  I want to retrieve a task and see its fields
  So I can inspect details

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title    | doneStatus | description |
      | Inspect  | false      | look        |

  Scenario: Normal - fetch existing by title then id
    When the student fetches TODO "Inspect"
    Then the fetched TODO has a non-empty id
    And the fetched TODO has title "Inspect"

  Scenario: Error - fetch by invalid id
    When the student fetches TODO id "999999"
    Then the student is notified of a 404 or 400 error

Feature: Edit TODO description
  As a student
  I want to update a task description
  So I can reflect new details

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title          | doneStatus | description |
      | Project setup  | false      | init repo   |
      | Empty desc     | false      | temp        |

  Scenario: Normal - update to a new description
    When the student changes the description of TODO "Project setup" to "init repo + CI"
    Then TODO "Project setup" has description "init repo + CI"

  Scenario: Alternate - clear description
    When the student changes the description of TODO "Empty desc" to ""
    Then TODO "Empty desc" has description ""

  Scenario: Error - invalid payload
    When the student updates TODO "Project setup" with an invalid payload
    Then the student is notified of a 404 or 400 error

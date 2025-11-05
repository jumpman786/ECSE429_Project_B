Feature: Edit TODO description
  As a student
  I want to change the details of a task
  So the description stays accurate

  Background:
    Given the server is running
    And TODOs with the following details exist
      | title         | doneStatus | description |
      | Project setup | false      | init repo   |
      | Empty desc    | false      | temp        |

  Scenario: Normal - update description via PUT
    When the student changes the description of TODO "Project setup" to "initialize repository and CI"
    Then TODO "Project setup" has description "initialize repository and CI"

  Scenario: Error - invalid payload
    When the student updates TODO "Project setup" with an invalid payload
    Then the student is notified of a 404 or 400 error

import { loginPage } from "../../support/page_objects/navigation"
import { isTestSuiteActive } from "../../support/page_objects/projectConstants"
import { mainPage } from "../../support/page_objects/mainPage"

const genTest = (type, xcdb) => {
  if(!isTestSuiteActive(type, xcdb)) return;

  describe(`${type.toUpperCase()} api - Table views`, () => {

    const name = 'Test' + Date.now();

    // Run once before test- create project (rest/graphql)
    //
    before(() => {
      loginPage.loginAndOpenProject(type)

      // open a table to work on views
      //
      cy.openTableTab('Country');
    })


    // Common routine to create/edit/delete GRID & GALLERY view
    // Input: viewType - 'grid'/'gallery'
    //
    const viewTest = (viewType) => {
        
        it(`Create ${viewType} view`, () => {
            // click on 'Grid/Gallery' button on Views bar
            cy.get(`.nc-create-${viewType}-view`).click();

            // Pop up window, click Submit (accepting default name for view)
            cy.getActiveModal().find('button:contains(Submit)').click()

            // validate if view was creted && contains default name 'Country1'
            cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country1').should('exist')
        })

        it(`Validate ${viewType} view: Drag & drop for re-order items`, () => {
            // default order: Country, LastUpdate, Country => City
            cy.get('.nc-field-wrapper').eq(0).contains('Country').should('exist')
            cy.get('.nc-field-wrapper').eq(1).contains('LastUpdate').should('exist')

            // move Country field down (drag, drop)
            cy.get('#data-table-form-Country').drag('#data-table-form-LastUpdate')

            // Verify if order is: LastUpdate, Country, Country => City
            cy.get('.nc-field-wrapper').eq(0).contains('LastUpdate').should('exist')
            cy.get('.nc-field-wrapper').eq(1).contains('Country').should('exist')            
        })
          
        it(`Validate ${viewType} view: Drag & drop for add/remove items`, () => {
            // default, only one item in menu-bar; ensure LastUpdate field was present in form view
            cy.get('.col-md-4').find('.pointer.item').its('length').should('eq', 1)
            cy.get('.nc-field-wrapper').eq(0).contains('LastUpdate').should('exist')
            
            // drag 'LastUpdate' & drop into menu bar drag-drop box
            cy.get('#data-table-form-LastUpdate').drag('.nc-drag-n-drop-to-hide')

            // validate- fields count in menu bar to be increased by 1 &&
            // first member in 'formView' is Country
            cy.get('.nc-field-wrapper').eq(0).contains('Country').should('exist')
            cy.get('.col-md-4').find('.pointer.item').its('length').should('eq', 2)
        })
        
        it(`Validate ${viewType} view: Inverted order field member addition from menu`, () => {
            cy.get('.col-md-4').find('.pointer.caption').contains('remove all').click()

            // click fields in inverted order: CountryId, Country, LastUpdate, Country => City
            cy.get('.col-md-4').find('.pointer.item').eq(3).click()
            cy.get('.col-md-4').find('.pointer.item').eq(2).click()
            cy.get('.col-md-4').find('.pointer.item').eq(1).click()
            cy.get('.col-md-4').find('.pointer.item').eq(0).click()

            // verify if order of appearance in form is right
            cy.get('.nc-field-wrapper').eq(0).contains('Country => City').should('exist')
            cy.get('.nc-field-wrapper').eq(1).contains('LastUpdate').should('exist')
            cy.get('.nc-field-wrapper').eq(2).contains('Country').should('exist')
            // hidden: cy.get('.nc-field-wrapper').eq(3).contains('CountryId').should('exist')
        })        
        
        it(`Validate ${viewType}: Form header & description validation`, () => {
            // Header & description should exist
            cy.get('.nc-form').find('[placeholder="Form Title"]').should('exist')
            cy.get('.nc-form').find('[placeholder="Add form description"]').should('exist')

            // Update header & add some description, verify
            cy.get('.nc-form').find('[placeholder="Form Title"]').type('A B C D')
            cy.get('.nc-form').find('[placeholder="Add form description"]').type('Some description about form comes here')

            // validate new contents
            cy.get('.nc-form').find('[placeholder="Form Title"]').contains('A B C D').should('exist')
            cy.get('.nc-form').find('[placeholder="Add form description"]').contains('Some description about form comes here').should('exist')
        })
            
        it(`Validate ${viewType}: Add all, Remove all validation`, () => {
            // .col-md-4 : left hand menu
            // .nc-form : form view (right hand side)

            // ensure buttons exist on left hand menu
            cy.get('.col-md-4').find('.pointer.caption').contains('add all').should('exist')
            cy.get('.col-md-4').find('.pointer.caption').contains('remove all').should('exist')

            // click: remove-all
            cy.get('.col-md-4').find('.pointer.caption').contains('remove all').click()
            // form should not contain any "field remove icons" -- all fields removed
            cy.get('.nc-form').find('.nc-field-remove-icon').should('not.exist')
            // menu bar should contain 4 .pointer.item (countryId, Country, LastUpdate, County->City)
            cy.get('.col-md-4').find('.pointer.item').its('length').should('eq', 4)

            // click: add all
            cy.get('.col-md-4').find('.pointer.caption').contains('add all').click()
            // form should contain "field remove icons"
            cy.get('.nc-form').find('.nc-field-remove-icon').should('exist')
            cy.get('.nc-form').find('.nc-field-remove-icon').its('length').should('eq', 4)
            // menu bar should not contain .pointer.item (column name/ field name add options)
            cy.get('.col-md-4').find('.pointer.item').should('not.exist')
        })
        
        it(`Validate ${viewType}: Submit default, empty show this message textbox`, () => {
            // fill up mandatory fields
            cy.get('#data-table-form-Country').type('_abc')
            cy.get('#data-table-form-LastUpdate').click()
            cy.getActiveModal().find('button').contains('19').click()
            cy.getActiveModal().find('button').contains('OK').click()

            // default message, no update

            // submit button & validate
            cy.get('.nc-form').find('button').contains('Submit').click()
            cy.get('.v-alert').contains('Successfully submitted form data').should('exist')

            // end of test removes newly added rows from table. that step validates if row was successfully added.
        })

        it(`Validate ${viewType}: Submit default, with valid Show message entry`, () => {
            // clicking again on view name shows blank still. work around- toggling between two views
            cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country').click()
            cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country1').click()

            // fill up mandatory fields
            cy.get('#data-table-form-Country').type('_abc')
            cy.get('#data-table-form-LastUpdate').click()
            cy.getActiveModal().find('button').contains('19').click()
            cy.getActiveModal().find('button').contains('OK').click()

            // add message
            cy.get('.nc-form > .mx-auto').find('textarea').type('Congratulations!')

            // submit button & validate
            cy.get('.nc-form').find('button').contains('Submit').click()
            cy.get('.v-alert').contains('Congratulations').should('exist')

            // end of test removes newly added rows from table. that step validates if row was successfully added.
        })

        it(`Validate ${viewType}: Submit default, Enable checkbox "Submit another form`, () => {
            // clicking again on view name shows blank still. work around- toggling between two views
            cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country').click()
            cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country1').click()

            // fill up mandatory fields
            cy.get('#data-table-form-Country').type('_abc')
            cy.get('#data-table-form-LastUpdate').click()
            cy.getActiveModal().find('button').contains('19').click()
            cy.getActiveModal().find('button').contains('OK').click()

            // enable "Submit another form" check box
            cy.get('.nc-form > .mx-auto').find('[type="checkbox"]').eq(0).click()

            // submit button & validate
            cy.get('.nc-form').find('button').contains('Submit').click()
            cy.get('.v-alert').contains('Congratulations').should('exist')
            cy.get('button').contains('Submit Another Form').should('exist')

            cy.get('button').contains('Submit Another Form').click()
            cy.wait(2000).then(() => {
                // New form appeared? Header & description should exist
                cy.get('.nc-form').find('[placeholder="Form Title"]').contains('A B C D').should('exist')
                cy.get('.nc-form').find('[placeholder="Add form description"]').contains('Some description about form comes here').should('exist')

                // end of test removes newly added rows from table. that step validates if row was successfully added.              
            })
        })            

        it(`Validate ${viewType}: Submit default, Enable checkbox "blank form after 5 seconds"`, () => {
            // cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country').click()
            // cy.get(`.nc-view-item.nc-${viewType}-view-item`).contains('Country1').click()

            cy.get('#data-table-form-Country').type('_abc')
            cy.get('#data-table-form-LastUpdate').click()
            cy.getActiveModal().find('button').contains('19').click()
            cy.getActiveModal().find('button').contains('OK').click()

            // enable "New form after 5 seconds" button
            cy.get('.nc-form > .mx-auto').find('[type="checkbox"]').eq(0).click( {force: true} )
            cy.get('.nc-form > .mx-auto').find('[type="checkbox"]').eq(1).click()

            // submit button & validate
            cy.get('.nc-form').find('button').contains('Submit').click()
            cy.get('.v-alert').contains('Congratulations').should('exist').then(() => {
                // wait for 5 seconds
                cy.wait(5000)
                cy.get('.v-alert').contains('Congratulations').should('not.exist')

                // validate if form has appeared again
                cy.get('.nc-form').find('[placeholder="Form Title"]').contains('A B C D').should('exist')
                cy.get('.nc-form').find('[placeholder="Add form description"]').contains('Some description about form comes here').should('exist')              
            })

            // end of test removes newly added rows from table. that step validates if row was successfully added.
        })

        it(`Validate ${viewType}: Add/ remove field verification"`, () => {
            cy.get('#data-table-form-Country').should('exist')
            // remove "country field"
            cy.get('.nc-form').find('.nc-field-remove-icon').eq(1).click()
            cy.get('#data-table-form-Country').should('not.exist')
            cy.get('.col-md-4').find('.pointer.item').contains('Country').should('exist')

            // add it back
            cy.get('.col-md-4').find('.pointer.item').contains('Country').click()
            cy.get('#data-table-form-Country').should('exist')
        })

        it(`Delete ${viewType} view`, () => {
            // number of view entries should be 2 before we delete
            cy.get('.nc-view-item').its('length').should('eq', 2)

            // click on delete icon (becomes visible on hovering mouse)
            cy.get('.nc-view-delete-icon').click({ force: true })
            cy.wait(1000)

            // confirm if the number of veiw entries is reduced by 1
            cy.get('.nc-view-item').its('length').should('eq', 1)

            // clean up newly added rows into Country table operations
            // this auto verifies successfull addition of rows to table as well
            mainPage.getPagination(5).click()
            cy.wait(3000)
            mainPage.getRow(10).find('.mdi-checkbox-blank-outline').click({ force: true })
            mainPage.getRow(11).find('.mdi-checkbox-blank-outline').click({ force: true })
            mainPage.getRow(12).find('.mdi-checkbox-blank-outline').click({ force: true })
            mainPage.getRow(13).find('.mdi-checkbox-blank-outline').click({ force: true })
            
            mainPage.getCell("Country", 10).rightclick()
            cy.getActiveMenu().contains('Delete Selected Row').click()            
        })
    }

    // below scenario's will be invoked twice, once for rest & then for graphql
    viewTest('form')

  })
}

// invoke for different API types supported
//
genTest('rest', false)
genTest('graphql', false)


/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Pranav C Balan <pranavxc@gmail.com>
 * @author Raju Udava <sivadstala@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */


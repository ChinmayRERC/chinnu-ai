import {describe,it,expect} from 'vitest';
import {actionSchema,agentActions} from '../src/agent/actions';
import {guides} from '../src/exercises/guides';
import {library} from '../src/exercises/engine';
describe('agent boundary',()=>{
 it('rejects external actions and undeclared arguments',()=>{expect(actionSchema.safeParse({action:'run_shell',command:'rm'}).success).toBe(false);expect(actionSchema.safeParse({action:'navigate',page:'Progress',secret:'x'}).success).toBe(false);});
 it('validates check-in ranges and exercise identifiers',()=>{expect(actionSchema.safeParse({action:'log_checkin',checkin:{energy:9,soreness:1,sleep:7,mood:'Okay'}}).success).toBe(false);expect(actionSchema.safeParse({action:'open_exercise',exerciseId:'heavy-deadlift'}).success).toBe(false);expect(actionSchema.parse({action:'navigate',page:'Progress'}).page).toBe('Progress');});
 it('has original three-step instruction content for every configured movement',()=>{for(const exercise of library){expect(guides[exercise.id].steps).toHaveLength(3);expect(guides[exercise.id].avoid.length).toBeGreaterThan(10);}expect(agentActions).toContain('show_guide');});
});

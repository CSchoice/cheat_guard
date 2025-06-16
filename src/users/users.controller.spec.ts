import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getAll', () => {
    it('should return array of users', async () => {
      const users: User[] = [
        {
          id: 1,
          nickname: 'a',
          password: 'p',
          role: 'student',
        },
      ];
      service.findAll!.mockResolvedValue(users);

      await expect(controller.getAll()).resolves.toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call service.create with DTO values and return created user', async () => {
      const dto = { nickname: 'mary', password: 'Abc123!@' };
      const created: User = {
        id: 2,
        nickname: dto.nickname,
        password: 'hashedPwd',
        role: 'student',
      };
      service.create!.mockResolvedValue(created);

      await expect(controller.create(dto)).resolves.toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto.nickname, dto.password);
    });
  });
});
